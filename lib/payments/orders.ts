import { createServiceClient } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/templates";
import { SERVICES, type ServiceId } from "@/lib/services";
import { PLANS, planPriceNpr, type PlanId, type BillingPeriod } from "@/lib/plans";
import { verifyKhalti } from "./khalti";
import { verifyEsewa } from "./esewa";
import { toPaisa, type Gateway } from "./types";

/**
 * Order lifecycle.
 *
 * One rule governs this whole file: an order becomes `paid` only after a server-to-
 * server call to the gateway confirms both the status and the amount. Nothing a
 * client sends — redirect parameters, a posted amount, a signed callback payload —
 * can move an order into `paid` on its own.
 *
 * That is not paranoia. Marking orders paid from redirect parameters is the standard
 * Nepali checkout bug, and it is exploitable by typing the success URL.
 */

export type PurchaseItem =
  | { type: "document"; slug: string; advocateReview?: boolean }
  | { type: "service"; id: ServiceId }
  | { type: "plan"; id: PlanId; period: BillingPeriod };

const ADVOCATE_REVIEW_NPR = 2_500;

/**
 * The price of an item, computed server-side from the registry.
 *
 * Deliberately takes no amount from the caller. A client that posts `amountNpr: 1`
 * for a NPR 599 document must not be able to buy it.
 */
export function priceNprOf(item: PurchaseItem): number | null {
  if (item.type === "plan") {
    // The free plan is not purchasable — there is nothing to charge for.
    const price = planPriceNpr(item.id, item.period);
    return price > 0 ? price : null;
  }
  if (item.type === "service") {
    return SERVICES[item.id]?.priceNpr ?? null;
  }
  const template = getTemplate(item.slug);
  if (!template) return null;
  return template.priceNpr + (item.advocateReview ? ADVOCATE_REVIEW_NPR : 0);
}

export function describeItem(item: PurchaseItem): string {
  if (item.type === "plan") {
    const plan = PLANS[item.id];
    return plan ? `${plan.name.en} plan (${item.period})` : "Subscription";
  }
  if (item.type === "service") return SERVICES[item.id]?.title.en ?? "Legal service";
  return getTemplate(item.slug)?.title.en ?? "Legal document";
}

export type PendingOrder = {
  id: string;
  amountPaisa: number;
  gateway: Gateway;
};

/** Opens a pending order. The row exists before the user ever reaches the gateway. */
export async function createPendingOrder(input: {
  userId: string;
  gateway: Gateway;
  item: PurchaseItem;
  documentId?: string;
}): Promise<PendingOrder | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  const npr = priceNprOf(input.item);
  if (npr === null) return null;

  const amountPaisa = toPaisa(npr);

  const { data, error } = await supabase
    .from("orders")
    .insert({
      user_id: input.userId,
      document_id: input.documentId ?? null,
      gateway: input.gateway,
      amount_paisa: amountPaisa,
      status: "pending",
      // Recorded now so the verification path knows what this payment buys without
      // trusting anything the client sends back with the redirect.
      plan_id: input.item.type === "plan" ? input.item.id : null,
      billing_period: input.item.type === "plan" ? input.item.period : null,
    })
    .select("id")
    .single();

  if (error || !data) return null;
  return { id: data.id as string, amountPaisa, gateway: input.gateway };
}

/** Records the gateway's reference so verification can look the transaction up later. */
export async function attachReference(orderId: string, reference: string): Promise<boolean> {
  const supabase = createServiceClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("orders")
    .update({ gateway_reference: reference })
    .eq("id", orderId)
    .eq("status", "pending");

  return !error;
}

export type VerifyOutcome = {
  status: "paid" | "pending" | "failed";
  orderId: string;
  reason?: string;
};

/**
 * Confirms an order against the gateway.
 *
 * Idempotent by design: gateways retry, users refresh, and the return page may fire
 * this more than once. An order already `paid` returns success without re-crediting.
 */
export async function verifyOrder(orderId: string): Promise<VerifyOutcome> {
  const supabase = createServiceClient();
  if (!supabase) return { status: "pending", orderId, reason: "not_configured" };

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, user_id, gateway, amount_paisa, status, gateway_reference, document_id, plan_id, billing_period",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order) return { status: "failed", orderId, reason: "unknown_order" };

  // Already settled — do not call the gateway again, do not re-release anything.
  if (order.status === "paid") return { status: "paid", orderId };
  if (order.status === "failed") return { status: "failed", orderId, reason: "already_failed" };

  const gateway = order.gateway as Gateway;
  const expectedPaisa = Number(order.amount_paisa);
  const reference = order.gateway_reference as string | null;

  let result;
  try {
    if (gateway === "khalti") {
      if (!reference) return { status: "pending", orderId, reason: "no_reference" };
      result = await verifyKhalti(reference);
    } else if (gateway === "esewa") {
      result = await verifyEsewa({ orderId, amountPaisa: expectedPaisa });
    } else {
      return { status: "pending", orderId, reason: "gateway_unsupported" };
    }
  } catch {
    // A gateway outage must never resolve as paid or as failed — leave it pending
    // so a later retry can settle it correctly.
    return { status: "pending", orderId, reason: "gateway_unreachable" };
  }

  if (result.status !== "paid") {
    if (result.status === "failed") {
      await supabase.from("orders").update({ status: "failed" }).eq("id", orderId);
    }
    return { status: result.status, orderId };
  }

  // Paid according to the gateway — now check they took what we asked for. An
  // underpayment must not release the document.
  if (result.amountPaisa !== null && result.amountPaisa !== expectedPaisa) {
    await supabase.from("orders").update({ status: "failed" }).eq("id", orderId);
    return { status: "failed", orderId, reason: "amount_mismatch" };
  }

  // Conditioned on status still being 'pending' so two concurrent verifications
  // cannot both transition the same order.
  const { data: settled } = await supabase
    .from("orders")
    .update({
      status: "paid",
      verified_at: new Date().toISOString(),
      gateway_reference: result.gatewayTransactionId ?? reference,
    })
    .eq("id", orderId)
    .eq("status", "pending")
    .select("id, document_id")
    .maybeSingle();

  // Losing that race is fine: the winner already marked it paid.
  const documentId = (settled?.document_id ?? order.document_id) as string | null;

  if (documentId) {
    await supabase.from("documents").update({ status: "purchased" }).eq("id", documentId);
  }

  /*
   * Subscription activation, unlike the document update above, is NOT idempotent —
   * activate_subscription extends the period on every call. So it runs only for the
   * request that actually won the pending -> paid transition. Without this guard two
   * concurrent verifications of one payment would grant two years of access.
   */
  if (settled && order.plan_id) {
    const plan = PLANS[order.plan_id as PlanId];
    if (plan) {
      await supabase.rpc("activate_subscription", {
        p_user: order.user_id as string,
        p_plan: order.plan_id as string,
        p_period: (order.billing_period as string) ?? "annual",
        // Entitlements are snapshotted onto the subscription, so a later change to
        // the plan catalogue does not alter what this subscriber already bought.
        p_questions: plan.entitlements.questionsPerMonth,
        p_reviews: plan.entitlements.reviewsPerMonth,
        p_seats: plan.entitlements.seats,
      });
    }
  }

  return { status: "paid", orderId };
}
