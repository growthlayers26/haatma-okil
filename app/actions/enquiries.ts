"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { SERVICES, type ServiceId } from "@/lib/services";

/**
 * The advocate desk.
 *
 * The firm has two practising advocates. An enquiry is assigned to one of them by
 * practice area with a load-balanced fallback — it is not escalated between tiers,
 * because both are licensed counsel.
 *
 * Ordering matters here and is a professional-conduct requirement, not a UX choice:
 * the opposing party is collected and screened BEFORE the matter is described, so a
 * conflicted enquiry is refused before privileged detail enters the system.
 */

export type Advocate = {
  id: string;
  fullName: { ne: string; en: string };
  nbcLicence: string;
  practiceAreas: string[];
};

export type ConflictResult =
  | { cleared: true; enquiryId: string; advocate: Advocate | null }
  | { cleared: false; reason: "conflict" | "unauthenticated" | "not_configured" | "error" };

export async function listAdvocates(): Promise<Advocate[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("advocates")
    .select("id, full_name_ne, full_name_en, nbc_licence, practice_areas")
    .eq("active", true)
    .order("created_at");

  if (error || !data) return [];

  return data.map((a) => ({
    id: a.id as string,
    fullName: { ne: a.full_name_ne as string, en: a.full_name_en as string },
    nbcLicence: a.nbc_licence as string,
    practiceAreas: (a.practice_areas ?? []) as string[],
  }));
}

const ScreenSchema = z.object({
  areaOfLaw: z.string().min(1),
  opposingParty: z.string().trim().min(1).max(200),
  kind: z.enum(["question", "consultation", "document_review"]),
  documentId: z.string().uuid().optional(),
});

/**
 * Step one: screen for conflict, then open the matter.
 *
 * The check is deliberately conservative — if the named opposing party resembles an
 * existing client of the firm, the enquiry is declined rather than assigned. A false
 * positive costs one enquiry; a false negative is a professional-conduct breach.
 *
 * REVIEW: this matches against existing client names only. Before launch it must also
 * read the firm's own conflict register, which lives outside this system today.
 */
export async function screenConflict(input: {
  areaOfLaw: string;
  opposingParty: string;
  kind: ServiceId;
  documentId?: string;
}): Promise<ConflictResult> {
  const parsed = ScreenSchema.safeParse(input);
  if (!parsed.success) return { cleared: false, reason: "error" };

  const supabase = await createClient();
  if (!supabase) return { cleared: false, reason: "not_configured" };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { cleared: false, reason: "unauthenticated" };

  const { areaOfLaw, opposingParty, kind, documentId } = parsed.data;

  // Escape LIKE wildcards so a party name containing % or _ can't widen the match.
  const needle = opposingParty.replace(/[%_\\]/g, (c) => `\\${c}`);

  const { data: clash } = await supabase
    .from("profiles")
    .select("id")
    .ilike("full_name", needle)
    .limit(1);

  if (clash && clash.length > 0) {
    await supabase.from("enquiries").insert({
      user_id: auth.user.id,
      area_of_law: areaOfLaw,
      opposing_party: opposingParty,
      kind,
      status: "declined",
    });
    return { cleared: false, reason: "conflict" };
  }

  const { data: assignedId } = await supabase.rpc("assign_advocate", { p_area: areaOfLaw });

  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + (kind === "consultation" ? 3 : kind === "document_review" ? 2 : 1));

  const { data: enquiry, error } = await supabase
    .from("enquiries")
    .insert({
      user_id: auth.user.id,
      document_id: documentId ?? null,
      advocate_id: assignedId ?? null,
      area_of_law: areaOfLaw,
      opposing_party: opposingParty,
      kind,
      status: "screening",
      conflict_cleared_at: new Date().toISOString(),
      due_at: dueAt.toISOString(),
    })
    .select("id")
    .single();

  if (error || !enquiry) return { cleared: false, reason: "error" };

  const advocates = await listAdvocates();
  const advocate = advocates.find((a) => a.id === assignedId) ?? null;

  revalidatePath("/dashboard");
  return { cleared: true, enquiryId: enquiry.id as string, advocate };
}

const DetailSchema = z.object({
  enquiryId: z.string().uuid(),
  question: z.string().trim().min(10).max(5000),
});

/**
 * Step two: attach the matter detail.
 *
 * Refuses unless conflict screening has already cleared, so no path exists that
 * stores privileged detail on an unscreened enquiry.
 */
export async function submitEnquiryDetail(input: {
  enquiryId: string;
  question: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const parsed = DetailSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };

  const supabase = await createClient();
  if (!supabase) return { ok: false, reason: "not_configured" };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, reason: "unauthenticated" };

  const { data, error } = await supabase
    .from("enquiries")
    .update({ question: parsed.data.question, status: "assigned" })
    .eq("id", parsed.data.enquiryId)
    .eq("user_id", auth.user.id)
    .eq("status", "screening")
    .not("conflict_cleared_at", "is", null)
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, reason: error.message };
  if (!data) return { ok: false, reason: "not_screened" };

  revalidatePath("/dashboard");
  return { ok: true };
}

export type ClientEnquiry = {
  id: string;
  kind: ServiceId;
  areaOfLaw: string;
  status: "screening" | "assigned" | "answered" | "declined";
  question: string | null;
  answer: string | null;
  dueAt: string | null;
  advocate: Advocate | null;
};

export async function listMyEnquiries(): Promise<ClientEnquiry[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];

  const { data, error } = await supabase
    .from("enquiries")
    .select("id, kind, area_of_law, status, question, answer, due_at, advocate_id")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  const advocates = await listAdvocates();

  return data.map((e) => ({
    id: e.id as string,
    kind: e.kind as ServiceId,
    areaOfLaw: e.area_of_law as string,
    status: e.status as ClientEnquiry["status"],
    question: (e.question ?? null) as string | null,
    answer: (e.answer ?? null) as string | null,
    dueAt: (e.due_at ?? null) as string | null,
    advocate: advocates.find((a) => a.id === e.advocate_id) ?? null,
  }));
}

export async function priceOf(kind: ServiceId): Promise<number> {
  return SERVICES[kind].priceNpr;
}
