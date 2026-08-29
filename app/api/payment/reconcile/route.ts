import { NextResponse } from "next/server";
import { reconcilePendingOrders } from "@/lib/payments/orders";
import { dispatchQueued } from "@/lib/notify";

/**
 * Settles payments whose buyer never returned.
 *
 * Meant to be called on a schedule — every few minutes is ample. Until then a
 * pending order only resolved if the user came back to /payment/return, which meant
 * a closed tab or a dropped mobile connection left money taken and nothing released.
 *
 * Guarded by a shared secret rather than a user session: the caller is a cron, not a
 * person. Without the secret configured the route refuses outright rather than
 * running unauthenticated — an open endpoint that walks every pending order is not
 * something to leave lying around.
 */
export async function POST(request: Request) {
  const secret = process.env.RECONCILE_SECRET;
  if (!secret) {
    return NextResponse.json({ message: "Reconciliation is not configured." }, { status: 503 });
  }

  const provided = request.headers.get("authorization");
  if (provided !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "Not authorised." }, { status: 401 });
  }

  // One schedule drives both: an order that settles here often has a message
  // waiting behind it, and sending in the same pass keeps the two in step.
  const orders = await reconcilePendingOrders();
  const messages = await dispatchQueued();

  return NextResponse.json({ orders, messages });
}
