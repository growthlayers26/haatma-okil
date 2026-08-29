"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { ServiceId } from "@/lib/services";
import { queue } from "@/lib/notify";

/**
 * The advocate's side of the desk.
 *
 * Until this existed the firm collected questions it had no way to open. The RLS
 * policies from 0002 were correct and matched nobody, because advocates.user_id was
 * never set.
 */

export type DeskMatter = {
  id: string;
  kind: ServiceId;
  areaOfLaw: string;
  status: "screening" | "assigned" | "answered" | "declined";
  question: string | null;
  answer: string | null;
  dueAt: string | null;
  coveredByPlan: boolean;
  createdAt: string;
};

export type DeskState =
  | { linked: true; advocateId: string; advocateName: string; matters: DeskMatter[] }
  | { linked: false; reason: "unauthenticated" | "not_configured" | "no_advocate_record" };

/**
 * Resolves the caller to an advocate, linking on first visit.
 *
 * The link is by verified email: sign-in is an emailed one-time link, so the session
 * proves control of the address.
 */
export async function getDesk(): Promise<DeskState> {
  const supabase = await createClient();
  const service = createServiceClient();
  if (!supabase || !service) return { linked: false, reason: "not_configured" };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.email) return { linked: false, reason: "unauthenticated" };

  const { data: advocateId } = await service.rpc("link_advocate_account", {
    p_user: auth.user.id,
    p_email: auth.user.email,
  });

  if (!advocateId) return { linked: false, reason: "no_advocate_record" };

  const { data: advocate } = await service
    .from("advocates")
    .select("full_name_en")
    .eq("id", advocateId)
    .maybeSingle();

  // Read through the caller's own session, so the RLS policy from 0002 is what
  // decides which matters are visible rather than this query's WHERE clause.
  const { data } = await supabase
    .from("enquiries")
    .select("id, kind, area_of_law, status, question, answer, due_at, covered_by_plan, created_at")
    .eq("advocate_id", advocateId)
    .order("due_at", { ascending: true, nullsFirst: false });

  return {
    linked: true,
    advocateId: advocateId as string,
    advocateName: (advocate?.full_name_en as string) ?? "",
    matters: (data ?? []).map((m) => ({
      id: m.id as string,
      kind: m.kind as ServiceId,
      areaOfLaw: m.area_of_law as string,
      status: m.status as DeskMatter["status"],
      question: (m.question ?? null) as string | null,
      answer: (m.answer ?? null) as string | null,
      dueAt: (m.due_at ?? null) as string | null,
      coveredByPlan: Boolean(m.covered_by_plan),
      createdAt: m.created_at as string,
    })),
  };
}

const AnswerSchema = z.object({
  enquiryId: z.string().uuid(),
  answer: z.string().trim().min(20).max(20_000),
});

export async function answerEnquiry(input: {
  enquiryId: string;
  answer: string;
}): Promise<{ ok: boolean; reason: string }> {
  const parsed = AnswerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "too_short" };

  const supabase = await createClient();
  const service = createServiceClient();
  if (!supabase || !service) return { ok: false, reason: "not_configured" };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, reason: "unauthenticated" };

  const { data, error } = await service.rpc("answer_enquiry", {
    p_enquiry: parsed.data.enquiryId,
    p_actor: auth.user.id,
    p_answer: parsed.data.answer,
  });
  if (error) return { ok: false, reason: "error" };

  // Only on a real transition — re-answering an already-closed matter must not
  // send the client a second message.
  if (data === "ok") void notifyClientOfAnswer(parsed.data.enquiryId);

  revalidatePath("/desk");
  revalidatePath("/dashboard");
  return { ok: data === "ok", reason: (data as string) ?? "error" };
}

/** Queue the "your answer is ready" message for whoever asked. */
async function notifyClientOfAnswer(enquiryId: string): Promise<void> {
  const service = createServiceClient();
  if (!service) return;

  const { data } = await service
    .from("enquiries")
    .select("user_id, kind")
    .eq("id", enquiryId)
    .maybeSingle();

  const userId = data?.user_id as string | undefined;
  if (!userId) return;

  const { data: account } = await service.auth.admin.getUserById(userId);
  const email = account?.user?.email;
  if (!email) return;

  await queue({
    channel: "email",
    recipient: email,
    kind: "enquiry_answered",
    subject: "An advocate has answered your question",
    // The answer itself is deliberately not in the email. It is legal advice about a
    // named dispute, and mail is neither private nor under the firm's control once
    // sent.
    body:
      "One of the firm's advocates has answered your question.\n\n" +
      "Sign in and open your dashboard to read it.",
    userId,
    enquiryId,
  });
}
