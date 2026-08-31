"use server";

import { getCustomerId } from "@/lib/auth/session";
import { one } from "@/lib/db/mysql";
import { quotaRemaining } from "@/lib/quota";
import {
  PLANS,
  FREE_ENTITLEMENTS,
  isPlanId,
  type Entitlements,
  type PlanId,
  type BillingPeriod,
} from "@/lib/plans";

/**
 * Subscription state for the signed-in customer.
 *
 * Read-only, and the only thing in this file. A subscription is created solely by the
 * order-paid path — there is deliberately no action a client can call that grants
 * itself entitlements.
 *
 * Spending an allowance lives in lib/quota.ts rather than here, because anything
 * exported from a `"use server"` file is an endpoint the browser can post to, and
 * those functions take a customer id.
 */

export type SubscriptionState = {
  planId: PlanId;
  billingPeriod: BillingPeriod | null;
  entitlements: Entitlements;
  /** Null when the customer is on free — nothing expires. */
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

type SubscriptionRow = {
  plan_id: string;
  billing_period: BillingPeriod | null;
  current_period_end: string | null;
};

export async function getSubscription(): Promise<SubscriptionState> {
  const customerId = await getCustomerId();
  if (!customerId) return FREE_STATE;

  const row = await one<SubscriptionRow>(
    `SELECT plan_id, billing_period, current_period_end
       FROM legal_subscriptions
      WHERE customer_id = ? AND status = 'active'`,
    [customerId],
  );

  if (!row) return FREE_STATE;

  // An expired row is still 'active' until something reconciles it, so the date is
  // what actually decides entitlement.
  const end = row.current_period_end;
  if (end && new Date(end).getTime() <= Date.now()) return FREE_STATE;

  const planId = isPlanId(row.plan_id) ? (row.plan_id as PlanId) : "free";

  const [questionsRemaining, reviewsRemaining] = await Promise.all([
    quotaRemaining(customerId, "question"),
    quotaRemaining(customerId, "review"),
  ]);

  return {
    planId,
    billingPeriod: row.billing_period ?? null,
    entitlements: PLANS[planId].entitlements,
    currentPeriodEnd: end,
    questionsRemaining,
    reviewsRemaining,
  };
}
