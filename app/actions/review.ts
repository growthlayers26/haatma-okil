"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCustomerId } from "@/lib/auth/session";
import { execute } from "@/lib/db/mysql";
import { extractFacts, isReviewConfigured } from "@/lib/review/extract";
import { evaluate, summarise, type Finding } from "@/lib/review/rules";
import { claimEntitlement, consumeQuota, releaseEntitlement, releaseQuota } from "@/lib/quota";
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

  const customerId = await getCustomerId();
  if (!customerId) return { ok: false, reason: "unauthenticated" };

  /*
   * A review must be paid for, by allowance or by entitlement, before the model is
   * called.
   *
   * Without this the analysis ran for anyone with an account: nothing was ever
   * charged, the price was displayed and never collected, and every submission spent
   * real API credit. That is a revenue hole and an unbounded cost in one function.
   *
   * Allowance first, since a subscriber should not be asked to pay twice.
   */
  const usageId = await consumeQuota(customerId, "review");
  const entitlementId = usageId ? null : await claimEntitlement(customerId, "review");

  if (!usageId && !entitlementId) {
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
    if (entitlementId) await releaseEntitlement(entitlementId);
    return { ok: false, reason: extracted.reason, message: extracted.message };
  }

  const findings = evaluate(extracted.facts);
  const summary = summarise(findings);

  // Persist the conclusions only. The document itself is never written down.
  const reviewId = randomUUID();

  await execute(
    `INSERT INTO legal_reviews
       (id, customer_id, document_type, facts, findings,
        breach_count, missing_count, check_count,
        covered_by_plan, entitlement_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      reviewId,
      customerId,
      extracted.facts.documentType,
      JSON.stringify(extracted.facts),
      JSON.stringify(findings),
      summary.breach,
      summary.missing,
      summary.check,
      usageId !== null,
      entitlementId,
    ],
  );

  revalidatePath("/dashboard");

  return {
    ok: true,
    reviewId,
    documentType: extracted.facts.documentType,
    findings,
    summary,
    coveredByPlan: usageId !== null,
    priceNpr: SERVICES.document_review.priceNpr,
  };
}
