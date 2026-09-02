import "server-only";

import { randomUUID } from "node:crypto";
import { call, execute, one, query } from "@/lib/db/mysql";
import { PLANS } from "@/lib/plans";
import { meaningOfSku } from "./catalogue";

/**
 * What a payment buys.
 *
 * Bagisto now owns the money. It records the order, raises the invoice, holds the
 * payment method and settles with the gateway — so the order lifecycle that used to
 * live in this file, including the sweep for buyers who never came back from a wallet,
 * is gone. Deleting it was the point of moving: reconciling an abandoned checkout is a
 * commerce problem that Bagisto has already solved, and maintaining a second answer to
 * "was this paid" is how the two answers start disagreeing.
 *
 * What Bagisto cannot know is what a payment means in legal terms. That is all this
 * file does now: turn a paid invoice into entitlements, and spend one to release a
 * document.
 *
 * The rule that survives unchanged is the important one. Nothing here reads a status
 * a client sent. Redemption is driven by a paid invoice row written by Bagisto's own
 * checkout — never by a redirect parameter. Marking orders paid from redirect
 * parameters is the standard Nepali checkout bug, and it is exploitable by typing the
 * success URL.
 */

export {
  priceNprOf,
  describeItem,
  skuOf,
  meaningOfSku,
  type PurchaseItem,
  type EntitlementKind,
} from "./catalogue";

/* ------------------------------------------------------------------ approval */

/**
 * Whether an organisation's approval workflow blocks releasing this document.
 *
 * This is what makes the workflow real rather than decorative. Without it a member
 * could route around their own organisation's control simply by paying — the draft
 * would finalise and the approval queue would be a display of documents that had
 * already gone out.
 *
 * A document with no organisation, or one whose organisation does not require
 * approval, is never blocked.
 */
export async function approvalBlocks(documentId: string): Promise<boolean> {
  const row = await one<{ approval_status: string; require_approval: number }>(
    `SELECT d.approval_status, o.require_approval
       FROM legal_documents d
       JOIN legal_organisations o ON o.id = d.org_id
      WHERE d.id = ?`,
    [documentId],
  );

  if (!row) return false;
  if (!row.require_approval) return false;

  return row.approval_status !== "approved";
}

/* ------------------------------------------------------------------ redemption */

export type RedeemReport = { ordersSeen: number; granted: number; subscriptions: number };

/**
 * Turn paid Bagisto orders into entitlements.
 *
 * Driven by `invoices.state = 'paid'`, which is the point at which Bagisto says the
 * money arrived — a more precise signal than the order's own status, which moves for
 * reasons that are not about payment.
 *
 * Safe to run repeatedly, and it is: the unique index on
 * (bagisto_order_id, order_item_id, seq) makes granting idempotent, so a re-sweep
 * inserts nothing it has already inserted.
 */
export async function redeemPaidOrders(
  limit = 100,
  /**
   * Narrow the sweep to one customer.
   *
   * The dashboard passes their own id so a purchase shows up the moment they look,
   * without waiting for a schedule. That matters more than it sounds: the alternative
   * is a customer who has just paid, sees nothing, and concludes it failed — and the
   * cron is the piece most likely to be missing on a fresh deployment, because it
   * lives in infrastructure rather than in this repository.
   */
  customerId?: number,
): Promise<RedeemReport> {
  const report: RedeemReport = { ordersSeen: 0, granted: 0, subscriptions: 0 };

  const lines = await query<{
    order_id: number;
    item_id: number;
    customer_id: number | null;
    sku: string;
    qty: number;
  }>(
    `SELECT o.id AS order_id, i.id AS item_id, o.customer_id, i.sku,
            GREATEST(1, CAST(i.qty_ordered AS UNSIGNED)) AS qty
       FROM invoices inv
       JOIN orders o      ON o.id = inv.order_id
       JOIN order_items i ON i.order_id = o.id
      WHERE inv.state = 'paid'
        AND o.customer_id IS NOT NULL
        AND (? IS NULL OR o.customer_id = ?)
        AND NOT EXISTS (
              SELECT 1 FROM legal_entitlements e
               WHERE e.bagisto_order_id = o.id AND e.order_item_id = i.id
            )
      ORDER BY o.id
      LIMIT ?`,
    [customerId ?? null, customerId ?? null, limit],
  );

  const orders = new Set<number>();

  for (const line of lines) {
    orders.add(line.order_id);

    const meaning = meaningOfSku(line.sku);
    // A product the firm sells that is not one of ours — nothing to grant, and not an
    // error. Bagisto may legitimately carry other things.
    if (!meaning || line.customer_id === null) continue;

    for (let seq = 0; seq < line.qty; seq += 1) {
      try {
        await execute(
          `INSERT INTO legal_entitlements
             (id, customer_id, bagisto_order_id, order_item_id, seq, kind, service_id,
              created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            randomUUID(),
            line.customer_id,
            line.order_id,
            line.item_id,
            seq,
            meaning.kind,
            meaning.serviceId ?? null,
          ],
        );
        report.granted += 1;
      } catch {
        // Already granted by a concurrent sweep. That is the index doing its job.
        continue;
      }

      /*
       * A subscription is applied rather than banked.
       *
       * Unlike the other kinds it is NOT idempotent — activation extends the period
       * on every call — so it runs only for the sweep that actually won the insert
       * above. Without that guard two concurrent sweeps of one payment would grant
       * two years of access.
       */
      if (meaning.kind === "subscription" && meaning.planId && meaning.period) {
        const plan = PLANS[meaning.planId];
        if (plan) {
          await call("legal_activate_subscription", [
            line.customer_id,
            meaning.planId,
            meaning.period,
            // Entitlements are snapshotted onto the subscription, so a later change
            // to the plan catalogue does not alter what this subscriber already
            // bought.
            plan.entitlements.questionsPerMonth,
            plan.entitlements.reviewsPerMonth,
            plan.entitlements.seats,
          ]);
          report.subscriptions += 1;
        }
      }
    }
  }

  report.ordersSeen = orders.size;
  return report;
}

export type UnlockOutcome =
  | { ok: true }
  | { ok: false; reason: "not_found" | "already_purchased" | "awaiting_approval" | "payment_required" };

/**
 * Spend a paid document entitlement to release one draft.
 *
 * Deliberately separate from redemption. A paid order grants "one document", and the
 * customer chooses which draft it releases — which avoids the alternative of guessing
 * from the order which of their drafts they meant, and getting it wrong on the one
 * occasion it matters.
 */
export async function unlockDocument(
  customerId: number,
  documentId: string,
): Promise<UnlockOutcome> {
  const doc = await one<{ status: string }>(
    `SELECT status FROM legal_documents WHERE id = ? AND customer_id = ?`,
    [documentId, customerId],
  );

  if (!doc) return { ok: false, reason: "not_found" };
  if (doc.status === "purchased") return { ok: true };

  if (await approvalBlocks(documentId)) return { ok: false, reason: "awaiting_approval" };

  const entitlementId = await call<string>("legal_claim_entitlement", [customerId, "document", null]);
  if (!entitlementId) return { ok: false, reason: "payment_required" };

  const updated = await execute(
    `UPDATE legal_documents
        SET status = 'purchased', updated_at = NOW()
      WHERE id = ? AND customer_id = ? AND status = 'draft'`,
    [documentId, customerId],
  );

  if (updated === 0) {
    // Someone else released it first. Hand the unit back rather than charging twice.
    await call("legal_release_entitlement", [entitlementId]);
    return { ok: true };
  }

  await execute(`UPDATE legal_entitlements SET document_id = ?, updated_at = NOW() WHERE id = ?`, [
    documentId,
    entitlementId,
  ]);

  return { ok: true };
}
