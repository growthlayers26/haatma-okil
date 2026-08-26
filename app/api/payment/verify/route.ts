import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyOrder } from "@/lib/payments/orders";

/**
 * Confirms a payment. This is the only route that can transition an order to `paid`.
 *
 * The gateway redirect that brings a user back proves only that they came back — it
 * can equally be a cancelled session, an error, or someone typing the success URL.
 * So the redirect handler calls this, and this asks the gateway what actually
 * happened. Nothing in the request body influences the outcome beyond naming which
 * order to check; the amount and status both come from the gateway.
 */

const Body = z.object({ orderId: z.string().uuid() });

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const outcome = await verifyOrder(parsed.data.orderId);
  return NextResponse.json(outcome);
}
