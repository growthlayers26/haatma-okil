"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { SERVICES, type ServiceId } from "@/lib/services";
import { consumeQuota, releaseQuota, linkQuotaToEnquiry } from "./subscription";
import { queue } from "@/lib/notify";
import { createServiceClient } from "@/lib/supabase/server";

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
  /** Null until the firm supplies it. Never rendered as a placeholder. */
  nbcLicence: string | null;
  /** Path under public/. Null renders the name alone rather than a broken image. */
  photoPath: string | null;
  practiceAreas: string[];
};

export type ConflictResult =
  | {
      cleared: true;
      enquiryId: string;
      advocate: Advocate | null;
      /** True when the subscriber's monthly allowance covered this matter. */
      coveredByPlan: boolean;
    }
  | { cleared: false; reason: "conflict" | "unauthenticated" | "not_configured" | "error" };

export async function listAdvocates(): Promise<Advocate[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("advocates")
    .select("id, full_name_ne, full_name_en, nbc_licence, practice_areas, photo_path")
    .eq("active", true)
    .order("created_at");

  if (error || !data) return [];

  return data.map((a) => ({
    id: a.id as string,
    fullName: { ne: a.full_name_ne as string, en: a.full_name_en as string },
    nbcLicence: (a.nbc_licence ?? null) as string | null,
    photoPath: (a.photo_path ?? null) as string | null,
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

  /*
   * Try to cover this from the subscriber's monthly allowance.
   *
   * A live consultation is deliberately never metered — it occupies an advocate's
   * diary rather than a slice of their writing time, so it is always billed.
   *
   * A false here is the ordinary path, not a failure: it means bill per matter.
   */
  const quotaKind = kind === "question" ? "question" : kind === "document_review" ? "review" : null;
  const usageId = quotaKind ? await consumeQuota(auth.user.id, quotaKind) : null;
  const coveredByPlan = usageId !== null;

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
      covered_by_plan: coveredByPlan,
    })
    .select("id")
    .single();

  if (error || !enquiry) {
    // The unit was taken before the matter existed. Since the matter could not be
    // opened, hand it back rather than charging a subscriber for nothing.
    if (usageId) await releaseQuota(usageId);
    return { cleared: false, reason: "error" };
  }

  if (usageId) await linkQuotaToEnquiry(usageId, enquiry.id as string);

  const advocates = await listAdvocates();
  const advocate = advocates.find((a) => a.id === assignedId) ?? null;

  revalidatePath("/dashboard");
  return { cleared: true, enquiryId: enquiry.id as string, advocate, coveredByPlan };
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

  /*
   * Tell the advocate. Deliberately after the update and never awaited into the
   * result: the matter is saved either way, and a notification that cannot be
   * written must not fail a submission the client has already paid for.
   */
  void notifyAdvocateOfMatter(parsed.data.enquiryId);

  revalidatePath("/dashboard");
  return { ok: true };
}

/** Queue the "new matter" message for whichever advocate holds it. */
async function notifyAdvocateOfMatter(enquiryId: string): Promise<void> {
  const service = createServiceClient();
  if (!service) return;

  const { data } = await service
    .from("enquiries")
    .select("id, kind, area_of_law, due_at, advocates(email, full_name_en)")
    .eq("id", enquiryId)
    .maybeSingle();

  const advocate = data?.advocates as unknown as { email: string | null } | null;
  if (!advocate?.email) return;

  await queue({
    channel: "email",
    recipient: advocate.email,
    kind: "matter_assigned",
    subject: "A new matter is waiting on the desk",
    body:
      `A ${String(data?.kind ?? "matter").replace(/_/g, " ")} in ${data?.area_of_law} has been ` +
      `assigned to you${data?.due_at ? `, due ${new Date(data.due_at as string).toDateString()}` : ""}.\n\n` +
      `Open the desk to read and answer it.`,
    enquiryId,
  });
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
