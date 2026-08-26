import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  createPendingOrder,
  attachReference,
  approvalBlocks,
  priceNprOf,
  describeItem,
  type PurchaseItem,
} from "@/lib/payments/orders";
import { initiateKhalti, isKhaltiConfigured } from "@/lib/payments/khalti";
import { initiateEsewa, isEsewaConfigured } from "@/lib/payments/esewa";
import { toPaisa } from "@/lib/payments/types";

/**
 * Opens a payment.
 *
 * The client says *what* it wants to buy, never *how much* it costs. Price comes from
 * the registry, server-side, every time.
 */

const Body = z.object({
  gateway: z.enum(["khalti", "esewa", "fonepay", "card"]),
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

function siteUrl(request: Request): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
}

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const { gateway, item, documentId } = parsed.data;

  const npr = priceNprOf(item as PurchaseItem);
  if (npr === null) {
    return NextResponse.json({ message: "Unknown item." }, { status: 404 });
  }

  if (gateway === "fonepay" || gateway === "card") {
    return NextResponse.json({
      message: `${gateway} is not enabled yet. Use Khalti or eSewa.`,
    });
  }

  const configured = gateway === "khalti" ? isKhaltiConfigured() : isEsewaConfigured();
  if (!configured) {
    return NextResponse.json({
      message:
        `${gateway} is not configured in this environment. ` +
        `Add its credentials to .env.local to enable live payment.`,
    });
  }

  // Payment is the first point an account is genuinely required — everything before
  // it works anonymously, because every field before payment is friction.
  const supabase = await createClient();
  const { data: auth } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  if (!auth.user) {
    return NextResponse.json({ message: "Sign in to complete payment.", requiresAuth: true }, { status: 401 });
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

  const order = await createPendingOrder({
    userId: auth.user.id,
    gateway,
    item: item as PurchaseItem,
    documentId,
  });

  if (!order) {
    return NextResponse.json({ message: "Could not open the order." }, { status: 500 });
  }

  const base = siteUrl(request);
  const returnUrl = `${base}/payment/return?order=${order.id}`;

  try {
    if (gateway === "khalti") {
      const handoff = await initiateKhalti({
        orderId: order.id,
        amountPaisa: toPaisa(npr),
        productName: describeItem(item as PurchaseItem),
        returnUrl,
        websiteUrl: base,
        customer: { email: auth.user.email ?? undefined },
      });
      await attachReference(order.id, handoff.reference);
      return NextResponse.json({ orderId: order.id, handoff });
    }

    const handoff = initiateEsewa({
      orderId: order.id,
      amountPaisa: toPaisa(npr),
      successUrl: returnUrl,
      failureUrl: `${base}/payment/return?order=${order.id}&failed=1`,
    });
    // eSewa's reference is our own transaction_uuid, so the order id is the reference.
    await attachReference(order.id, handoff.reference);
    return NextResponse.json({ orderId: order.id, handoff });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gateway error.";
    return NextResponse.json({ message }, { status: 502 });
  }
}
