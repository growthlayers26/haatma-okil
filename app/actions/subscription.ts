"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { PLANS, FREE_ENTITLEMENTS, isPlanId, type Entitlements, type PlanId, type BillingPeriod } from "@/lib/plans";

/**
 * Subscription state for the signed-in user.
 *
 * Everything here is read-only. A subscription is created solely by the payment
 * verification path running as the service role — there is deliberately no action a
 * client can call that grants itself entitlements.
 */

export type SubscriptionState = {
  planId: PlanId;
  billingPeriod: BillingPeriod | null;
  entitlements: Entitlements;
  /** Null when the user is on free — nothing expires. */
  currentPeriodEnd: string | null;
  questionsRemaining: number;
  reviewsRemaining: number;
};

const FREE_STATE: SubscriptionState = {
  planId: "free",
  billingPeriod: null,
  entitlements: FREE_ENTITLEMENTS,
  currentPeriodEnd: null,
  questionsRemaining: 0,
  reviewsRemaining: 0,
};

export async function getSubscription(): Promise<SubscriptionState> {
  const supabase = await createClient();
  if (!supabase) return FREE_STATE;

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return FREE_STATE;

  const { data, error } = await supabase
    .from("subscriptions")
    .select("plan_id, billing_period, current_period_end, status")
    .eq("user_id", auth.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) return FREE_STATE;

  // An expired row is still 'active' until something reconciles it, so the date is
  // what actually decides entitlement.
  const end = data.current_period_end as string | null;
  if (end && new Date(end).getTime() <= Date.now()) return FREE_STATE;

  const planId = isPlanId(data.plan_id as string) ? (data.plan_id as PlanId) : "free";

  const [questions, reviews] = await Promise.all([
    supabase.rpc("quota_remaining", { p_user: auth.user.id, p_kind: "question" }),
    supabase.rpc("quota_remaining", { p_user: auth.user.id, p_kind: "review" }),
  ]);

  return {
    planId,
    billingPeriod: (data.billing_period as BillingPeriod | null) ?? null,
    entitlements: PLANS[planId].entitlements,
    currentPeriodEnd: end,
    questionsRemaining: Number(questions.data ?? 0),
    reviewsRemaining: Number(reviews.data ?? 0),
  };
}

/**
 * Try to cover one advocate matter from the subscriber's monthly allowance.
 *
 * Returns the id of the consumed unit, or null to mean bill it per matter — the
 * normal path for free users and for subscribers who have used the month's
 * allowance, not an error.
 *
 * The id matters: the caller must hand the unit back with releaseQuota if opening
 * the matter then fails, otherwise a subscriber pays an allowance unit for nothing.
 *
 * Runs through the service role because consuming quota writes a usage row, and no
 * client-facing policy should be able to.
 */
export async function consumeQuota(
  userId: string,
  kind: "question" | "review",
): Promise<string | null> {
  const service = createServiceClient();
  if (!service) return null;

  const { data, error } = await service.rpc("consume_quota", {
    p_user: userId,
    p_kind: kind,
  });

  if (error || !data) return null;
  return data as string;
}

/** Returns a consumed unit to the subscriber's allowance. */
export async function releaseQuota(usageId: string): Promise<void> {
  const service = createServiceClient();
  if (!service) return;
  await service.rpc("release_quota", { p_usage_id: usageId });
}

/** Links a consumed unit to the matter it paid for, for the usage audit trail. */
export async function linkQuotaToEnquiry(usageId: string, enquiryId: string): Promise<void> {
  const service = createServiceClient();
  if (!service) return;
  await service.from("quota_usage").update({ enquiry_id: enquiryId }).eq("id", usageId);
}
