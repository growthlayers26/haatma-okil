import { createServiceClient } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/templates";
import { SERVICES, type ServiceId } from "@/lib/services";
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
  | { type: "service"; id: ServiceId };

const ADVOCATE_REVIEW_NPR = 2_500;

/**
 * The price of an item, computed server-side from the registry.
 *
 * Deliberately takes no amount from the caller. A client that posts `amountNpr: 1`
 * for a NPR 599 document must not be able to buy it.
 */
export function priceNprOf(item: PurchaseItem): number | null {
  if (item.type === "service") {
    return SERVICES[item.id]?.priceNpr ?? null;
  }
  const template = getTemplate(item.slug);
  if (!template) return null;
  return template.priceNpr + (item.advocateReview ? ADVOCATE_REVIEW_NPR : 0);
}

export function describeItem(item: PurchaseItem): string {
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
    .select("id, gateway, amount_paisa, status, gateway_reference, document_id")
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

  return { status: "paid", orderId };
}
