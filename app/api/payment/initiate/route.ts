import { NextResponse } from "next/server";
import { z } from "zod";
import { getCustomerId } from "@/lib/auth/session";
import { mintCheckoutHandoff } from "@/lib/payments/checkoutHandoff";
import { approvalBlocks, priceNprOf, skuOf, type PurchaseItem } from "@/lib/payments/orders";

/**
 * Opens a payment.
 *
 * Bagisto takes it from here. This route decides *what* is being bought and whether
 * the customer is allowed to buy it; the cart, the payment method, the gateway call
 * and the invoice all belong to Bagisto's checkout, which the browser is handed off
 * to.
 *
 * The client still never says what something costs. Price comes from the registry,
 * server-side — and it is checked here even though nothing is charged from this
 * response, because a request naming an item that has no price is a bug worth
 * refusing rather than passing to the shop.
 */

const Body = z.object({
  // Kept so the existing checkout component posts unchanged. The gateway is no longer
  // chosen here — Bagisto's checkout offers whatever payment methods the firm has
  // enabled, which is where that choice belongs now.
  gateway: z.enum(["khalti", "esewa", "fonepay", "card"]).optional(),
  documentId: z.string().uuid().optional(),
  item: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("document"),
      slug: z.string().min(1),
      advocateReview: z.boolean().optional(),
    }),
    z.object({
      type: z.literal("service"),
      id: z.enum([
        "question",
        "consultation",
        "document_review",
        "company_registration",
        "trademark",
        "tax_registration",
      ]),
    }),
    z.object({
      type: z.literal("plan"),
      // "free" is absent on purpose: it costs nothing, so there is nothing to buy.
      id: z.enum(["business", "enterprise"]),
      period: z.enum(["monthly", "annual"]),
    }),
  ]),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const { item, documentId } = parsed.data;

  if (priceNprOf(item as PurchaseItem) === null) {
    return NextResponse.json({ message: "Unknown item." }, { status: 404 });
  }

  // Payment is the first point an account is genuinely required — everything before
  // it works anonymously, because every field before payment is friction.
  const customerId = await getCustomerId();
  if (!customerId) {
    return NextResponse.json(
      { message: "Sign in to complete payment.", requiresAuth: true },
      { status: 401 },
    );
  }

  // An organisation running an approval workflow gates payment, not just display.
  if (documentId && (await approvalBlocks(documentId))) {
    return NextResponse.json(
      {
        message:
          "This document needs approval from an administrator in your organisation before it can be purchased.",
        needsApproval: true,
      },
      { status: 409 },
    );
  }

  const bagistoUrl = process.env.BAGISTO_URL ?? "http://localhost";
  const sku = skuOf(item as PurchaseItem);
  const handoffToken = await mintCheckoutHandoff(customerId, sku);

  /*
   * A redirect rather than a fetch. Bagisto's cart lives in the session, so the cart
   * has to be built by the customer's own browser — a cart assembled from this server
   * would belong to this server.
   *
   * `handoff` is what keeps that browser's Bagisto session honest. Bagisto spends it
   * to confirm — or, if the browser's own session is stale or belongs to someone else,
   * to correct — which customer it is signing in as, rather than trusting whatever
   * session already happened to be active there. See mintCheckoutHandoff().
   */
  return NextResponse.json({
    handoff: {
      mode: "redirect",
      url: `${bagistoUrl}/legal/buy/${encodeURIComponent(sku)}?handoff=${handoffToken}`,
    },
  });
}
