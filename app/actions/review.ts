"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { extractFacts, isReviewConfigured } from "@/lib/review/extract";
import { evaluate, summarise, type Finding } from "@/lib/review/rules";
import { consumeQuota, releaseQuota, claimServiceOrder, releaseServiceOrder } from "./subscription";
import { SERVICES } from "@/lib/services";

/**
 * Contract review.
 *
 * The model reads the document and reports observations; lib/review/rules.ts decides
 * what the law makes of them from our own constants. Nothing here produces legal
 * advice — findings are phrased as questions for an advocate, which is also the
 * escalation this feature exists to create.
 */

export type ReviewOutcome =
  | {
      ok: true;
      reviewId: string | null;
      documentType: string;
      findings: Finding[];
      summary: { breach: number; missing: number; check: number };
      coveredByPlan: boolean;
      /** Price if this was not covered by an allowance. */
      priceNpr: number;
    }
  | {
      ok: false;
      reason:
        | "not_configured"
        | "too_long"
        | "refused"
        | "unparsed"
        | "unauthenticated"
        | "payment_required"
        | "error";
      message?: string;
      /** Set on payment_required so the caller can show the price without guessing. */
      priceNpr?: number;
    };

const InputSchema = z.object({
  text: z.string().trim().min(200, "too_short").max(120_000, "too_long"),
});

export async function reviewContract(input: { text: string }): Promise<ReviewOutcome> {
  const parsed = InputSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.message;
    return { ok: false, reason: issue === "too_long" ? "too_long" : "error", message: issue };
  }

  if (!isReviewConfigured()) return { ok: false, reason: "not_configured" };

  const supabase = await createClient();
  if (!supabase) return { ok: false, reason: "not_configured" };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, reason: "unauthenticated" };

  /*
   * A review must be paid for, by allowance or by order, before the model is called.
   *
   * Without this the analysis ran for anyone with an account: no order was ever
   * created, the price was displayed and never charged, and every submission spent
   * real API credit. That is a revenue hole and an unbounded cost in one function.
   *
   * Allowance first, since a subscriber should not be asked to pay twice.
   */
  const usageId = await consumeQuota(auth.user.id, "review");
  const orderId = usageId ? null : await claimServiceOrder(auth.user.id, "document_review");

  if (!usageId && !orderId) {
    return {
      ok: false,
      reason: "payment_required",
      priceNpr: SERVICES.document_review.priceNpr,
    };
  }

  const extracted = await extractFacts(parsed.data.text);

  if (!extracted.ok) {
    // Hand back whatever was spent — nobody pays for an analysis that errored.
    if (usageId) await releaseQuota(usageId);
    if (orderId) await releaseServiceOrder(orderId);
    return { ok: false, reason: extracted.reason, message: extracted.message };
  }

  const findings = evaluate(extracted.facts);
  const summary = summarise(findings);

  // Persist the conclusions only. The document itself is never written down — see
  // the note at the top of migration 0004.
  const { data: row } = await supabase
    .from("reviews")
    .insert({
      user_id: auth.user.id,
      document_type: extracted.facts.documentType,
      facts: extracted.facts,
      findings,
      breach_count: summary.breach,
      missing_count: summary.missing,
      check_count: summary.check,
      covered_by_plan: usageId !== null,
      order_id: orderId,
    })
    .select("id")
    .maybeSingle();

  revalidatePath("/dashboard");

  return {
    ok: true,
    reviewId: (row?.id as string) ?? null,
    documentType: extracted.facts.documentType,
    findings,
    summary,
    coveredByPlan: usageId !== null,
    priceNpr: SERVICES.document_review.priceNpr,
  };
}
