import { createServiceClient } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/templates";
import { SERVICES, type ServiceId } from "@/lib/services";
import { PLANS, planPriceNpr, type PlanId, type BillingPeriod } from "@/lib/plans";
import { verifyKhalti } from "./khalti";
import { verifyEsewa } from "./esewa";
import { toPaisa, type Gateway } from "./types";

/**
 * Order lifecycle.
 *
 * One rule governs this whole file: an order becomes `paid` only after a server-to-
 * server call to the gateway confirms both the status and the amount. Nothing a
 * client sends — redirect parameters, a posted amount, a signed callback payload —
 * can move an order into `paid` on its own.
 *
 * That is not paranoia. Marking orders paid from redirect parameters is the standard
 * Nepali checkout bug, and it is exploitable by typing the success URL.
 */

export type PurchaseItem =
  | { type: "document"; slug: string; advocateReview?: boolean }
  | { type: "service"; id: ServiceId }
  | { type: "plan"; id: PlanId; period: BillingPeriod };

const ADVOCATE_REVIEW_NPR = 2_500;

/**
 * The price of an item, computed server-side from the registry.
 *
 * Deliberately takes no amount from the caller. A client that posts `amountNpr: 1`
 * for a NPR 599 document must not be able to buy it.
 */
export function priceNprOf(item: PurchaseItem): number | null {
  if (item.type === "plan") {
    // The free plan is not purchasable — there is nothing to charge for.
    const price = planPriceNpr(item.id, item.period);
    return price > 0 ? price : null;
  }
  if (item.type === "service") {
    return SERVICES[item.id]?.priceNpr ?? null;
  }
  const template = getTemplate(item.slug);
  if (!template) return null;
  return template.priceNpr + (item.advocateReview ? ADVOCATE_REVIEW_NPR : 0);
}

export function describeItem(item: PurchaseItem): string {
  if (item.type === "plan") {
    const plan = PLANS[item.id];
    return plan ? `${plan.name.en} plan (${item.period})` : "Subscription";
  }
  if (item.type === "service") return SERVICES[item.id]?.title.en ?? "Legal service";
  return getTemplate(item.slug)?.title.en ?? "Legal document";
}

/**
 * Whether an organisation's approval workflow blocks buying this document.
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
  const supabase = createServiceClient();
  if (!supabase) return false;

  const { data } = await supabase
    .from("documents")
    .select("approval_status, organisations!inner(require_approval)")
    .eq("id", documentId)
    .maybeSingle();

  if (!data) return false;

  const org = data.organisations as unknown as { require_approval: boolean } | null;
  if (!org?.require_approval) return false;

  return data.approval_status !== "approved";
}

export type PendingOrder = {
  id: string;
  amountPaisa: number;
  gateway: Gateway;
};

/** Opens a pending order. The row exists before the user ever reaches the gateway. */
export async function createPendingOrder(input: {
  userId: string;
  gateway: Gateway;
  item: PurchaseItem;
  documentId?: string;
}): Promise<PendingOrder | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const npr = priceNprOf(input.item);
  if (npr === null) return null;

  const amountPaisa = toPaisa(npr);

  const { data, error } = await supabase
    .from("orders")
    .insert({
      user_id: input.userId,
      document_id: input.documentId ?? null,
      gateway: input.gateway,
      amount_paisa: amountPaisa,
      status: "pending",
      // Recorded now so the verification path knows what this payment buys without
      // trusting anything the client sends back with the redirect.
      plan_id: input.item.type === "plan" ? input.item.id : null,
      billing_period: input.item.type === "plan" ? input.item.period : null,
      // Without this a paid review is indistinguishable from a paid consultation,
      // and nothing downstream can check that a service was actually bought.
      service_id: input.item.type === "service" ? input.item.id : null,
    })
    .select("id")
    .single();

  if (error || !data) return null;
  return { id: data.id as string, amountPaisa, gateway: input.gateway };
}

/** Records the gateway's reference so verification can look the transaction up later. */
export async function attachReference(orderId: string, reference: string): Promise<boolean> {
  const supabase = createServiceClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("orders")
    .update({ gateway_reference: reference })
    .eq("id", orderId)
    .eq("status", "pending");

  return !error;
}

export type VerifyOutcome = {
  status: "paid" | "pending" | "failed";
  orderId: string;
  reason?: string;
};

/**
 * Confirms an order against the gateway.
 *
 * Idempotent by design: gateways retry, users refresh, and the return page may fire
 * this more than once. An order already `paid` returns success without re-crediting.
 */
export async function verifyOrder(orderId: string): Promise<VerifyOutcome> {
  const supabase = createServiceClient();
  if (!supabase) return { status: "pending", orderId, reason: "not_configured" };

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, user_id, gateway, amount_paisa, status, gateway_reference, document_id, plan_id, billing_period",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order) return { status: "failed", orderId, reason: "unknown_order" };

  // Already settled — do not call the gateway again, do not re-release anything.
  if (order.status === "paid") return { status: "paid", orderId };
  if (order.status === "failed") return { status: "failed", orderId, reason: "already_failed" };

  const gateway = order.gateway as Gateway;
  const expectedPaisa = Number(order.amount_paisa);
  const reference = order.gateway_reference as string | null;

  let result;
  try {
    if (gateway === "khalti") {
      if (!reference) return { status: "pending", orderId, reason: "no_reference" };
      result = await verifyKhalti(reference);
    } else if (gateway === "esewa") {
      result = await verifyEsewa({ orderId, amountPaisa: expectedPaisa });
    } else {
      return { status: "pending", orderId, reason: "gateway_unsupported" };
    }
  } catch {
    // A gateway outage must never resolve as paid or as failed — leave it pending
    // so a later retry can settle it correctly.
    return { status: "pending", orderId, reason: "gateway_unreachable" };
  }

  if (result.status !== "paid") {
    if (result.status === "failed") {
      await supabase.from("orders").update({ status: "failed" }).eq("id", orderId);
    }
    return { status: result.status, orderId };
  }

  // Paid according to the gateway — now check they took what we asked for. An
  // underpayment must not release the document.
  if (result.amountPaisa !== null && result.amountPaisa !== expectedPaisa) {
    await supabase.from("orders").update({ status: "failed" }).eq("id", orderId);
    return { status: "failed", orderId, reason: "amount_mismatch" };
  }

  // Conditioned on status still being 'pending' so two concurrent verifications
  // cannot both transition the same order.
  const { data: settled } = await supabase
    .from("orders")
    .update({
      status: "paid",
      verified_at: new Date().toISOString(),
      gateway_reference: result.gatewayTransactionId ?? reference,
    })
    .eq("id", orderId)
    .eq("status", "pending")
    .select("id, document_id")
    .maybeSingle();

  // Losing that race is fine: the winner already marked it paid.
  const documentId = (settled?.document_id ?? order.document_id) as string | null;

  if (documentId) {
    await supabase.from("documents").update({ status: "purchased" }).eq("id", documentId);
  }

  /*
   * Subscription activation, unlike the document update above, is NOT idempotent —
   * activate_subscription extends the period on every call. So it runs only for the
   * request that actually won the pending -> paid transition. Without this guard two
   * concurrent verifications of one payment would grant two years of access.
   */
  if (settled && order.plan_id) {
    const plan = PLANS[order.plan_id as PlanId];
    if (plan) {
      await supabase.rpc("activate_subscription", {
        p_user: order.user_id as string,
        p_plan: order.plan_id as string,
        p_period: (order.billing_period as string) ?? "annual",
        // Entitlements are snapshotted onto the subscription, so a later change to
        // the plan catalogue does not alter what this subscriber already bought.
        p_questions: plan.entitlements.questionsPerMonth,
        p_reviews: plan.entitlements.reviewsPerMonth,
        p_seats: plan.entitlements.seats,
      });
    }
  }

  return { status: "paid", orderId };
}

/* ------------------------------------------------------------------ reconciliation */

/**
 * How long to leave an order alone before chasing it.
 *
 * A user still at the gateway is not abandoned. Verifying too eagerly asks the
 * gateway about a transaction that has not happened yet and burns the call.
 */
const RECONCILE_AFTER_MINUTES = 3;

/**
 * How long an unresolved order stays worth chasing.
 *
 * Beyond this a wallet session is long dead. The order is failed so it stops being
 * swept forever — but note this only closes OUR record. It never asserts that money
 * did not move, which is why the failure is recorded rather than the row deleted.
 */
const ABANDON_AFTER_HOURS = 24;

export type ReconcileReport = {
  checked: number;
  paid: number;
  failed: number;
  stillPending: number;
  abandoned: number;
};

/**
 * Settle orders whose buyer never came back.
 *
 * Verification previously ran only when the user returned to /payment/return. Close
 * the tab mid-Khalti — or lose signal, which is the normal case on a Nepali mobile
 * connection — and the money left the wallet while the order sat `pending` forever.
 * The document was never released and nobody was told. That is a refund dispute the
 * firm would lose.
 *
 * This sweeps them. It is safe to run repeatedly: verifyOrder is idempotent and
 * conditions the paid transition on the row still being pending.
 */
export async function reconcilePendingOrders(limit = 50): Promise<ReconcileReport> {
  const supabase = createServiceClient();
  const report: ReconcileReport = {
    checked: 0,
    paid: 0,
    failed: 0,
    stillPending: 0,
    abandoned: 0,
  };
  if (!supabase) return report;

  const now = Date.now();
  const ripe = new Date(now - RECONCILE_AFTER_MINUTES * 60_000).toISOString();
  const deadline = new Date(now - ABANDON_AFTER_HOURS * 3_600_000).toISOString();

  const { data: stale } = await supabase
    .from("orders")
    .select("id, created_at")
    .eq("status", "pending")
    .lt("created_at", ripe)
    .gte("created_at", deadline)
    .order("created_at")
    .limit(limit);

  for (const order of stale ?? []) {
    report.checked += 1;
    const outcome = await verifyOrder(order.id as string);
    if (outcome.status === "paid") report.paid += 1;
    else if (outcome.status === "failed") report.failed += 1;
    else report.stillPending += 1;
  }

  /*
   * Anything older than the window is closed out. Deliberately a separate statement
   * rather than folded into the sweep: these are not being verified, they are being
   * given up on, and conflating the two would hide how often it happens.
   */
  const { data: abandoned } = await supabase
    .from("orders")
    .update({ status: "failed" })
    .eq("status", "pending")
    .lt("created_at", deadline)
    .select("id");

  report.abandoned = abandoned?.length ?? 0;
  return report;
}
