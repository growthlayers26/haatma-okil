"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDeskUser } from "@/lib/auth/session";
import { call, one, query } from "@/lib/db/mysql";
import type { ServiceId } from "@/lib/services";
import { queue } from "@/lib/notify";

/**
 * The advocate's side of the desk.
 *
 * Until this existed the firm collected questions it had no way to open: the old
 * policies were correct and matched nobody, because `advocates.user_id` was never
 * set. Advocates are now Bagisto admins, and signing in links the two on email — so
 * the account that opens the desk is the same account the firm created for them.
 *
 * Note what changed underneath. The matter list used to be filtered by a row-level
 * security policy, so the WHERE clause below was a convenience and the database was
 * the thing actually deciding what an advocate could see. There is no policy now. The
 * `advocate_id = ?` predicate IS the access control, and dropping it would show every
 * advocate every client's matter.
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

export async function getDesk(): Promise<DeskState> {
  const user = await getDeskUser();
  if (!user) return { linked: false, reason: "unauthenticated" };

  /*
   * A staff account with no advocate row. Reported rather than shown as an empty
   * desk, because the usual cause is an address that does not match the one on the
   * advocate record — which looks identical to "no matters yet" and is not.
   */
  if (!user.advocateId) return { linked: false, reason: "no_advocate_record" };

  const advocate = await one<{ full_name_en: string }>(
    `SELECT full_name_en FROM legal_advocates WHERE id = ?`,
    [user.advocateId],
  );

  const rows = await query<{
    id: string;
    kind: ServiceId;
    area_of_law: string;
    status: DeskMatter["status"];
    question: string | null;
    answer: string | null;
    due_at: string | null;
    covered_by_plan: number;
    created_at: string;
  }>(
    `SELECT id, kind, area_of_law, status, question, answer, due_at,
            covered_by_plan, created_at
       FROM legal_enquiries
      WHERE advocate_id = ?
      ORDER BY due_at IS NULL, due_at ASC`,
    [user.advocateId],
  );

  return {
    linked: true,
    advocateId: user.advocateId,
    advocateName: advocate?.full_name_en ?? user.name,
    matters: rows.map((m) => ({
      id: m.id,
      kind: m.kind,
      areaOfLaw: m.area_of_law,
      status: m.status,
      question: m.question,
      answer: m.answer,
      dueAt: m.due_at,
      coveredByPlan: Boolean(m.covered_by_plan),
      createdAt: m.created_at,
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

  const user = await getDeskUser();
  if (!user) return { ok: false, reason: "unauthenticated" };

  /*
   * The procedure re-derives the advocate from the staff account and refuses anything
   * not assigned to them. Passing the admin id rather than the advocate id is
   * deliberate: it means this action cannot answer on someone else's behalf even if
   * the session were wrong about who is signed in.
   */
  const result = await call<string>("legal_answer_enquiry", [
    parsed.data.enquiryId,
    user.adminId,
    parsed.data.answer,
  ]);

  // Only on a real transition — re-answering an already-closed matter must not send
  // the client a second message.
  if (result === "ok") void notifyClientOfAnswer(parsed.data.enquiryId);

  revalidatePath("/desk");
  revalidatePath("/dashboard");
  return { ok: result === "ok", reason: result ?? "error" };
}

/** Queue the "your answer is ready" message for whoever asked. */
async function notifyClientOfAnswer(enquiryId: string): Promise<void> {
  const row = await one<{ customer_id: number; email: string | null }>(
    `SELECT e.customer_id, c.email
       FROM legal_enquiries e
       JOIN customers c ON c.id = e.customer_id
      WHERE e.id = ?`,
    [enquiryId],
  );

  if (!row?.email) return;

  await queue({
    channel: "email",
    recipient: row.email,
    kind: "enquiry_answered",
    subject: "An advocate has answered your question",
    // The answer itself is deliberately not in the email. It is legal advice about a
    // named dispute, and mail is neither private nor under the firm's control once
    // sent.
    body:
      "One of the firm's advocates has answered your question.\n\n" +
      "Sign in and open your dashboard to read it.",
    customerId: row.customer_id,
    enquiryId,
  });
}
