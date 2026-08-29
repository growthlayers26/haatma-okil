"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isDigitalSigningAvailable } from "@/lib/signing/ca";

/**
 * Signature envelopes.
 *
 * Two routes exist in the schema; only the wet-ink one can complete, because no
 * certifying authority adapter is implemented. That is enforced in the database
 * (complete_envelope) as well as here, so the guarantee does not rest on this file
 * being correct.
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

  const supabase = await createClient();
  if (!supabase) return { ok: false, reason: "not_configured" };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, reason: "unauthenticated" };

  // Only a document the user owns, and only one they have actually bought — an
  // envelope over a watermarked draft would circulate a specimen for signature.
  const { data: doc } = await supabase
    .from("documents")
    .select("id, status, org_id")
    .eq("id", parsed.data.documentId)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!doc) return { ok: false, reason: "not_found" };
  if (doc.status !== "purchased") return { ok: false, reason: "not_purchased" };

  const { data: envelope, error } = await supabase
    .from("signature_envelopes")
    .insert({
      document_id: parsed.data.documentId,
      created_by: auth.user.id,
      org_id: doc.org_id ?? null,
      method: parsed.data.method,
      subject: parsed.data.subject,
      status: "sent",
    })
    .select("id")
    .single();

  if (error || !envelope) return { ok: false, reason: "error" };

  const rows = parsed.data.signatories.map((s, i) => ({
    envelope_id: envelope.id as string,
    full_name: s.fullName,
    email: s.email || null,
    capacity: s.capacity || null,
    order_index: i,
  }));

  const { error: sigError } = await supabase.from("signatories").insert(rows);
  if (sigError) return { ok: false, reason: "error" };

  const service = createServiceClient();
  await service?.from("signature_events").insert({
    envelope_id: envelope.id as string,
    actor_id: auth.user.id,
    kind: "envelope_created",
    detail: { method: parsed.data.method, signatories: rows.length },
  });

  revalidatePath("/sign");
  return { ok: true, envelopeId: envelope.id as string };
}

/**
 * Envelopes the caller can see: the ones they opened, and the ones they are named
 * on. The filter is deliberately absent — RLS decides, so a signatory sees exactly
 * what migration 0013 grants and nothing depends on this query getting it right.
 */
export async function listEnvelopes(): Promise<EnvelopeSummary[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];

  const { data } = await supabase
    .from("signature_envelopes")
    .select(
      "id, document_id, subject, method, status, created_at, created_by, documents(template_slug), signatories(id, full_name, capacity, status, signed_at, order_index)",
    )
    .order("created_at", { ascending: false });

  return (data ?? []).map((e) => {
    const doc = e.documents as unknown as { template_slug: string } | null;
    const sigs = (e.signatories ?? []) as unknown as {
      id: string;
      full_name: string;
      capacity: string | null;
      status: "pending" | "signed" | "declined";
      signed_at: string | null;
      order_index: number;
    }[];

    return {
      id: e.id as string,
      documentId: e.document_id as string,
      templateSlug: doc?.template_slug ?? null,
      subject: e.subject as string,
      method: e.method as SigningMethod,
      status: e.status as EnvelopeSummary["status"],
      isOwner: e.created_by === auth.user!.id,
      signatories: [...sigs]
        .sort((a, b) => a.order_index - b.order_index)
        .map((s) => ({
          id: s.id,
          fullName: s.full_name,
          capacity: s.capacity,
          status: s.status,
          signedAt: s.signed_at,
        })),
      createdAt: e.created_at as string,
    };
  });
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

  const supabase = await createClient();
  const service = createServiceClient();
  if (!supabase || !service) return { ok: false, reason: "not_configured" };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, reason: "unauthenticated" };

  const { data, error } = await service.rpc("record_wet_ink_signature", {
    p_signatory: parsed.data.signatoryId,
    p_actor: auth.user.id,
    p_path: parsed.data.whereHeld,
  });
  if (error) return { ok: false, reason: "error" };

  revalidatePath("/sign");
  return { ok: data === "ok", reason: (data as string) ?? "error" };
}

export async function completeEnvelope(
  envelopeId: string,
): Promise<{ ok: boolean; reason: string }> {
  const supabase = await createClient();
  const service = createServiceClient();
  if (!supabase || !service) return { ok: false, reason: "not_configured" };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, reason: "unauthenticated" };

  const { data, error } = await service.rpc("complete_envelope", {
    p_envelope: envelopeId,
    p_actor: auth.user.id,
  });
  if (error) return { ok: false, reason: "error" };

  revalidatePath("/sign");
  return { ok: data === "ok", reason: (data as string) ?? "error" };
}
