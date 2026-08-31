import { NextResponse } from "next/server";
import { redeemPaidOrders } from "@/lib/payments/orders";
import { dispatchQueued } from "@/lib/notify";

/**
 * Turns paid orders into entitlements, and sends what is queued.
 *
 * Meant to be called on a schedule — every few minutes is ample.
 *
 * This used to chase payments whose buyer never came back from a wallet. It no longer
 * has to: Bagisto owns the order lifecycle and settles its own abandoned checkouts, so
 * what remains is the half Bagisto cannot do — reading a paid invoice and working out
 * what it entitles someone to in legal terms.
 *
 * Guarded by a shared secret rather than a user session: the caller is a cron, not a
 * person. Without the secret configured the route refuses outright rather than running
 * unauthenticated — an open endpoint that walks every paid order is not something to
 * leave lying around.
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

  // One schedule drives both: an order that redeems here often has a message waiting
  // behind it, and sending in the same pass keeps the two in step.
  const orders = await redeemPaidOrders();
  const messages = await dispatchQueued();

  return NextResponse.json({ orders, messages });
}
