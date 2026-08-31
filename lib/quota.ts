import "server-only";

import { call, execute } from "@/lib/db/mysql";

/**
 * Spending an allowance unit, or a paid entitlement.
 *
 * These are NOT server actions, and that is deliberate. They used to live in
 * `app/actions/subscription.ts` under a `"use server"` directive, which makes every
 * exported function an endpoint the browser can post to — including these, which take
 * the customer id as an argument. Anyone could have called `consumeQuota` with
 * somebody else's id and burned their monthly allowance.
 *
 * Under Postgres that was uncomfortable; here it would be worse, because the
 * row-level security that used to sit behind these calls is gone. So they are plain
 * server-only functions now: reachable from other server code, unreachable from the
 * network. Callers pass an id they resolved from the session themselves.
 *
 * Both pairs follow the same shape — claim before the work, hand back if the work
 * fails — so that nobody ever pays for an analysis that errored.
 */

/**
 * Try to cover one matter from the subscriber's monthly allowance.
 *
 * Returns the id of the consumed unit, or null to mean bill it per matter — the
 * normal path for free users and for subscribers who have used the month's
 * allowance, not an error.
 *
 * The id matters: the caller must hand the unit back with releaseQuota if opening the
 * matter then fails, otherwise a subscriber pays an allowance unit for nothing.
 */
export async function consumeQuota(
  customerId: number,
  kind: "question" | "review",
): Promise<string | null> {
  return call<string>("legal_consume_quota", [customerId, kind]);
}

/** Returns a consumed unit to the subscriber's allowance. */
export async function releaseQuota(usageId: string): Promise<void> {
  await call("legal_release_quota", [usageId]);
}

/** Links a consumed unit to the matter it paid for, for the usage audit trail. */
export async function linkQuotaToEnquiry(usageId: string, enquiryId: string): Promise<void> {
  await execute(`UPDATE legal_quota_usage SET enquiry_id = ? WHERE id = ?`, [enquiryId, usageId]);
}

/**
 * Claim one paid, unspent entitlement of a given kind.
 *
 * Returns null when the customer has nothing paid to spend, which means the caller
 * must ask for payment rather than proceed.
 */
export async function claimEntitlement(
  customerId: number,
  kind: "document" | "review" | "question" | "consultation",
): Promise<string | null> {
  return call<string>("legal_claim_entitlement", [customerId, kind]);
}

/** Return a claimed entitlement to the unspent pool. */
export async function releaseEntitlement(entitlementId: string): Promise<void> {
  await call("legal_release_entitlement", [entitlementId]);
}

/** Remaining allowance of a kind this calendar month, without consuming any. */
export async function quotaRemaining(
  customerId: number,
  kind: "question" | "review",
): Promise<number> {
  const value = await call<number | string>("legal_quota_remaining", [customerId, kind]);
  return Number(value ?? 0);
}
