"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCustomerId } from "@/lib/auth/session";
import { execute, one, query } from "@/lib/db/mysql";
import { redeemPaidOrders, unlockDocument } from "@/lib/payments/orders";
import { getTemplate } from "@/lib/templates";
import type { Answers } from "@/lib/types";

/**
 * Document persistence.
 *
 * localStorage remains the working store during drafting: it is instant, it works
 * before sign-in, and it survives the app switch that Khalti and eSewa force during
 * payment. These actions add the durable copy — the one that survives a cleared
 * browser or a different device.
 *
 * Every statement here carries `customer_id = ?`, without exception. Under Postgres
 * that clause was belt and braces; row-level security would have refused the row
 * anyway. On MySQL there is no such second line of defence, so a forgotten predicate
 * is a customer reading another customer's contract. It is spelled out on every
 * query for that reason, including the ones where it looks redundant.
 */

export type SavedDocument = {
  id: string;
  templateSlug: string;
  answers: Answers;
  status: "draft" | "purchased";
  updatedAt: string;
};

type DocumentRow = {
  id: string;
  template_slug: string;
  answers: Answers | string | null;
  status: "draft" | "purchased";
  updated_at: string;
};

const AnswersSchema = z.record(z.string(), z.union([z.string(), z.number()]).optional());

const SaveSchema = z.object({
  id: z.string().uuid().optional(),
  templateSlug: z.string().min(1),
  answers: AnswersSchema,
});

/** MySQL returns JSON columns already parsed; older drivers hand back a string. */
function readAnswers(value: DocumentRow["answers"]): Answers {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as Answers;
    } catch {
      return {};
    }
  }
  return value;
}

function toSaved(row: DocumentRow): SavedDocument {
  return {
    id: row.id,
    templateSlug: row.template_slug,
    answers: readAnswers(row.answers),
    status: row.status,
    updatedAt: row.updated_at,
  };
}

export async function saveDocument(input: {
  id?: string;
  templateSlug: string;
  answers: Answers;
}): Promise<{ ok: true; id: string } | { ok: false; reason: string }> {
  const parsed = SaveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };

  // Reject unknown slugs so a caller can't create rows for templates that don't exist.
  if (!getTemplate(parsed.data.templateSlug)) return { ok: false, reason: "unknown_template" };

  const customerId = await getCustomerId();
  if (!customerId) return { ok: false, reason: "unauthenticated" };

  const answers = JSON.stringify(parsed.data.answers);

  // A purchased document is immutable — editing it after payment would let a buyer
  // alter an instrument the firm has already put its name to.
  if (parsed.data.id) {
    const updated = await execute(
      `UPDATE legal_documents
          SET template_slug = ?, answers = ?, updated_at = NOW()
        WHERE id = ? AND customer_id = ? AND status = 'draft'`,
      [parsed.data.templateSlug, answers, parsed.data.id, customerId],
    );

    if (updated > 0) {
      revalidatePath("/dashboard");
      return { ok: true, id: parsed.data.id };
    }
    // Fall through and insert if the update matched nothing.
  }

  const id = randomUUID();

  await execute(
    `INSERT INTO legal_documents (id, customer_id, template_slug, answers, created_at, updated_at)
     VALUES (?, ?, ?, ?, NOW(), NOW())`,
    [id, customerId, parsed.data.templateSlug, answers],
  );

  revalidatePath("/dashboard");
  return { ok: true, id };
}

/**
 * One document belonging to the caller.
 *
 * Returns null rather than throwing when it is missing or someone else's — the
 * caller renders a not-found page either way, and distinguishing the two would tell
 * a stranger that a given id exists.
 */
export async function getDocument(id: string): Promise<SavedDocument | null> {
  const customerId = await getCustomerId();
  if (!customerId) return null;

  const row = await one<DocumentRow>(
    `SELECT id, template_slug, answers, status, updated_at
       FROM legal_documents
      WHERE id = ? AND customer_id = ?`,
    [id, customerId],
  );

  return row ? toSaved(row) : null;
}

export async function listDocuments(): Promise<SavedDocument[]> {
  const customerId = await getCustomerId();
  if (!customerId) return [];

  const rows = await query<DocumentRow>(
    `SELECT id, template_slug, answers, status, updated_at
       FROM legal_documents
      WHERE customer_id = ?
      ORDER BY updated_at DESC`,
    [customerId],
  );

  return rows.map(toSaved);
}

/**
 * Moves drafts made before sign-in onto the account.
 *
 * Called once after login. Skips any template that already has a server-side draft,
 * so signing in on a second device doesn't clobber work saved from the first.
 */
export async function claimLocalDrafts(
  drafts: { templateSlug: string; answers: Answers }[],
): Promise<{ claimed: number }> {
  const customerId = await getCustomerId();
  if (!customerId) return { claimed: 0 };

  const existing = await listDocuments();
  const alreadyHeld = new Set(existing.map((d) => d.templateSlug));

  const toInsert = drafts
    .filter((d) => getTemplate(d.templateSlug))
    .filter((d) => Object.keys(d.answers).length > 0)
    .filter((d) => !alreadyHeld.has(d.templateSlug));

  if (toInsert.length === 0) return { claimed: 0 };

  const values = toInsert.map(() => "(?, ?, ?, ?, NOW(), NOW())").join(", ");
  const params = toInsert.flatMap((d) => [
    randomUUID(),
    customerId,
    d.templateSlug,
    JSON.stringify(d.answers),
  ]);

  await execute(
    `INSERT INTO legal_documents (id, customer_id, template_slug, answers, created_at, updated_at)
     VALUES ${values}`,
    params,
  );

  revalidatePath("/dashboard");
  return { claimed: toInsert.length };
}

/**
 * How many paid, unspent document credits the customer holds.
 *
 * A paid order grants "one document" rather than releasing a particular draft,
 * because the cart cannot carry a draft id through Bagisto's checkout and guessing
 * which draft was meant would be wrong on the one occasion it mattered. So the
 * customer is shown what they have and picks.
 */
export async function documentCreditsAvailable(): Promise<number> {
  const customerId = await getCustomerId();
  if (!customerId) return 0;

  /*
   * Redeem this customer's paid orders before counting.
   *
   * The scheduled sweep does the same thing for everyone, but scheduling lives in
   * infrastructure and is the piece most likely to be missing on a fresh deployment.
   * Doing it here means a purchase appears the moment its buyer looks, which is the
   * only moment that matters to them — and it is cheap, because it is scoped to one
   * customer and grants nothing it has already granted.
   */
  await redeemPaidOrders(20, customerId);

  const row = await one<{ n: number }>(
    `SELECT COUNT(*) AS n
       FROM legal_entitlements
      WHERE customer_id = ? AND kind = 'document' AND consumed_at IS NULL`,
    [customerId],
  );

  return Number(row?.n ?? 0);
}

/**
 * Spend one credit to release a draft.
 *
 * This is the step that was missing: payment granted a credit and nothing ever spent
 * it, so a document stayed a draft after being paid for — no unwatermarked copy, and
 * no signature envelope, since an envelope refuses anything unpurchased.
 */
export async function releaseDocument(
  documentId: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!z.string().uuid().safeParse(documentId).success) {
    return { ok: false, reason: "invalid" };
  }

  const customerId = await getCustomerId();
  if (!customerId) return { ok: false, reason: "unauthenticated" };

  const outcome = await unlockDocument(customerId, documentId);

  revalidatePath("/dashboard");
  revalidatePath(`/documents/${documentId}`);

  return outcome.ok ? { ok: true } : { ok: false, reason: outcome.reason };
}

export async function deleteDocument(id: string): Promise<{ ok: boolean }> {
  const customerId = await getCustomerId();
  if (!customerId) return { ok: false };

  const deleted = await execute(
    `DELETE FROM legal_documents
      WHERE id = ? AND customer_id = ? AND status = 'draft'`,
    [id, customerId],
  );

  revalidatePath("/dashboard");
  return { ok: deleted > 0 };
}
