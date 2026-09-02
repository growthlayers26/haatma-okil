"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCustomer } from "@/lib/auth/session";
import { call, execute, one, query } from "@/lib/db/mysql";
import { isDigitalSigningAvailable } from "@/lib/signing/ca";

/**
 * Signature envelopes.
 *
 * Two routes exist in the schema; only the wet-ink one can complete, because no
 * certifying authority adapter is implemented. That is enforced in the database
 * (legal_complete_envelope) as well as here, so the guarantee does not rest on this
 * file being correct.
 *
 * READ THIS BEFORE CHANGING ANY QUERY HERE. Under Postgres, `listEnvelopes` ran with
 * no WHERE clause at all, and that was correct: a row-level security policy decided
 * that you see an envelope if you sent it or are named on it. There is no policy any
 * more. Every rule that policy expressed is now written out below, and a query that
 * loses its predicate does not fail — it quietly shows one client another client's
 * contract and the people signing it.
 */

export type SigningMethod = "wet_ink" | "digital_certificate";

export type EnvelopeSummary = {
  id: string;
  documentId: string;
  templateSlug: string | null;
  subject: string;
  method: SigningMethod;
  status: "draft" | "sent" | "completed" | "voided";
  /** False when the caller is a named signatory rather than the sender. */
  isOwner: boolean;
  signatories: {
    id: string;
    fullName: string;
    capacity: string | null;
    status: "pending" | "signed" | "declined";
    signedAt: string | null;
  }[];
  createdAt: string;
};

const CreateSchema = z.object({
  documentId: z.string().uuid(),
  subject: z.string().trim().min(2).max(200),
  method: z.enum(["wet_ink", "digital_certificate"]),
  signatories: z
    .array(
      z.object({
        fullName: z.string().trim().min(2).max(120),
        email: z.string().trim().email().optional().or(z.literal("")),
        capacity: z.string().trim().max(60).optional(),
      }),
    )
    .min(1)
    .max(10),
});

export async function createEnvelope(
  input: unknown,
): Promise<{ ok: true; envelopeId: string } | { ok: false; reason: string }> {
  const parsed = CreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };

  // Refused at the door as well as at completion. Letting someone open a digital
  // envelope that can never finish would waste their time and look like a bug.
  if (parsed.data.method === "digital_certificate" && !isDigitalSigningAvailable()) {
    return { ok: false, reason: "digital_unavailable" };
  }

  const customer = await getCustomer();
  if (!customer) return { ok: false, reason: "unauthenticated" };

  // Only a document the customer owns, and only one they have actually bought — an
  // envelope over a watermarked draft would circulate a specimen for signature.
  const doc = await one<{ id: string; status: string; org_id: string | null }>(
    `SELECT id, status, org_id
       FROM legal_documents
      WHERE id = ? AND customer_id = ?`,
    [parsed.data.documentId, customer.id],
  );

  if (!doc) return { ok: false, reason: "not_found" };
  if (doc.status !== "purchased") return { ok: false, reason: "not_purchased" };

  const envelopeId = randomUUID();

  try {
    await execute(
      `INSERT INTO legal_signature_envelopes
         (id, document_id, created_by, org_id, method, subject, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'sent', NOW(), NOW())`,
      [
        envelopeId,
        parsed.data.documentId,
        customer.id,
        doc.org_id,
        parsed.data.method,
        parsed.data.subject,
      ],
    );

    const values = parsed.data.signatories.map(() => "(?, ?, ?, ?, ?, ?, NOW(), NOW())").join(", ");
    const params = parsed.data.signatories.flatMap((s, i) => [
      randomUUID(),
      envelopeId,
      s.fullName,
      s.email || null,
      s.capacity || null,
      i,
    ]);

    await execute(
      `INSERT INTO legal_signatories
         (id, envelope_id, full_name, email, capacity, order_index, created_at, updated_at)
       VALUES ${values}`,
      params,
    );

    await execute(
      `INSERT INTO legal_signature_events
         (id, envelope_id, actor_kind, actor_id, kind, detail, created_at)
       VALUES (?, ?, 'customer', ?, 'envelope_created', ?, NOW())`,
      [
        randomUUID(),
        envelopeId,
        customer.id,
        JSON.stringify({
          method: parsed.data.method,
          signatories: parsed.data.signatories.length,
        }),
      ],
    );
  } catch {
    return { ok: false, reason: "error" };
  }

  revalidatePath("/sign");
  return { ok: true, envelopeId };
}

/**
 * Envelopes the caller can see: the ones they opened, and the ones they are named on.
 *
 * The email match is what lets a signatory who is not the sender open the envelope
 * they were invited to. It compares against the address on their Bagisto account,
 * which is the only address they have proved control of — matching on a
 * self-declared one would let anyone claim any envelope by typing the right address.
 */
export async function listEnvelopes(): Promise<EnvelopeSummary[]> {
  const customer = await getCustomer();
  if (!customer) return [];

  const envelopes = await query<{
    id: string;
    document_id: string;
    subject: string;
    method: SigningMethod;
    status: EnvelopeSummary["status"];
    created_at: string;
    created_by: number;
    template_slug: string | null;
  }>(
    `SELECT e.id, e.document_id, e.subject, e.method, e.status, e.created_at, e.created_by,
            d.template_slug
       FROM legal_signature_envelopes e
       LEFT JOIN legal_documents d ON d.id = e.document_id
      WHERE e.created_by = ?
         OR EXISTS (
              SELECT 1 FROM legal_signatories s
               WHERE s.envelope_id = e.id AND LOWER(s.email) = LOWER(?)
            )
      ORDER BY e.created_at DESC`,
    [customer.id, customer.email],
  );

  if (envelopes.length === 0) return [];

  const placeholders = envelopes.map(() => "?").join(", ");
  const signatories = await query<{
    id: string;
    envelope_id: string;
    full_name: string;
    capacity: string | null;
    status: "pending" | "signed" | "declined";
    signed_at: string | null;
    order_index: number;
  }>(
    `SELECT id, envelope_id, full_name, capacity, status, signed_at, order_index
       FROM legal_signatories
      WHERE envelope_id IN (${placeholders})
      ORDER BY order_index`,
    envelopes.map((e) => e.id),
  );

  return envelopes.map((e) => ({
    id: e.id,
    documentId: e.document_id,
    templateSlug: e.template_slug,
    subject: e.subject,
    method: e.method,
    status: e.status,
    isOwner: e.created_by === customer.id,
    signatories: signatories
      .filter((s) => s.envelope_id === e.id)
      .map((s) => ({
        id: s.id,
        fullName: s.full_name,
        capacity: s.capacity,
        status: s.status,
        signedAt: s.signed_at,
      })),
    createdAt: e.created_at,
  }));
}

/**
 * Whether the caller may act on this envelope: they sent it, or they are named on it
 * at the address their account proves they control.
 *
 * Its own function because three actions need the same answer, and because the old
 * code did not check at all — it called through the service role, so anyone holding a
 * signatory id could record a signature against it. Unguessable ids are not access
 * control.
 */
async function mayActOnEnvelope(envelopeId: string, customerId: number, email: string) {
  return one<{ id: string }>(
    `SELECT e.id
       FROM legal_signature_envelopes e
      WHERE e.id = ?
        AND (e.created_by = ?
             OR EXISTS (
                  SELECT 1 FROM legal_signatories s
                   WHERE s.envelope_id = e.id AND LOWER(s.email) = LOWER(?)
                ))`,
    [envelopeId, customerId, email],
  );
}

/**
 * Record that a signatory signed the printed copy.
 *
 * This does not create legal effect — the signature on paper did. What it records is
 * that it happened and where the executed original is held, which is the thing the
 * firm needs when the document is later relied on.
 */
export async function recordWetInkSignature(
  signatoryId: string,
  whereHeld: string,
): Promise<{ ok: boolean; reason: string }> {
  const parsed = z
    .object({ signatoryId: z.string().uuid(), whereHeld: z.string().trim().min(2).max(300) })
    .safeParse({ signatoryId, whereHeld });
  if (!parsed.success) return { ok: false, reason: "invalid" };

  const customer = await getCustomer();
  if (!customer) return { ok: false, reason: "unauthenticated" };

  const signatory = await one<{ envelope_id: string }>(
    `SELECT envelope_id FROM legal_signatories WHERE id = ?`,
    [parsed.data.signatoryId],
  );
  if (!signatory) return { ok: false, reason: "not_found" };

  const permitted = await mayActOnEnvelope(signatory.envelope_id, customer.id, customer.email);
  if (!permitted) return { ok: false, reason: "not_permitted" };

  const result = await call<string>("legal_record_wet_ink_signature", [
    parsed.data.signatoryId,
    customer.id,
    parsed.data.whereHeld,
  ]);

  revalidatePath("/sign");
  return { ok: result === "ok", reason: result ?? "error" };
}

export async function completeEnvelope(
  envelopeId: string,
): Promise<{ ok: boolean; reason: string }> {
  if (!z.string().uuid().safeParse(envelopeId).success) {
    return { ok: false, reason: "invalid" };
  }

  const customer = await getCustomer();
  if (!customer) return { ok: false, reason: "unauthenticated" };

  const permitted = await mayActOnEnvelope(envelopeId, customer.id, customer.email);
  if (!permitted) return { ok: false, reason: "not_permitted" };

  const result = await call<string>("legal_complete_envelope", [envelopeId, customer.id]);

  revalidatePath("/sign");
  return { ok: result === "ok", reason: result ?? "error" };
}
