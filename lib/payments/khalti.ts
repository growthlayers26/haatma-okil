import { GatewayNotConfigured, type Handoff, type VerifyResult } from "./types";

/**
 * Khalti ePay v2.
 *
 * Chosen as the primary rail because its API is the cleanest of the three and its
 * sandbox behaves like production, which is rarer than it should be.
 *
 * Amounts are in paisa throughout. Khalti's minimum is NPR 10 (1000 paisa).
 */

const LIVE = "https://a.khalti.com/api/v2";
const SANDBOX = "https://dev.khalti.com/api/v2";

function config() {
  const secret = process.env.KHALTI_SECRET_KEY;
  if (!secret) throw new GatewayNotConfigured("khalti");
  // Khalti issues distinct sandbox keys; treat anything non-live as sandbox.
  const base = process.env.KHALTI_ENV === "live" ? LIVE : SANDBOX;
  return { secret, base };
}

export function isKhaltiConfigured(): boolean {
  return Boolean(process.env.KHALTI_SECRET_KEY);
}

export async function initiateKhalti(input: {
  orderId: string;
  amountPaisa: number;
  productName: string;
  returnUrl: string;
  websiteUrl: string;
  customer?: { name?: string; email?: string; phone?: string };
}): Promise<Handoff> {
  const { secret, base } = config();

  const response = await fetch(`${base}/epayment/initiate/`, {
    method: "POST",
    headers: {
      Authorization: `Key ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      return_url: input.returnUrl,
      website_url: input.websiteUrl,
      amount: input.amountPaisa,
      purchase_order_id: input.orderId,
      purchase_order_name: input.productName,
      customer_info: input.customer
        ? {
            name: input.customer.name,
            email: input.customer.email,
            phone: input.customer.phone,
          }
        : undefined,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Khalti initiate failed (${response.status}): ${detail}`);
  }

  const data = (await response.json()) as { pidx: string; payment_url: string };
  return { mode: "redirect", url: data.payment_url, reference: data.pidx };
}

/**
 * Asks Khalti what actually happened.
 *
 * Called only from the server-side verification path. The `pidx` comes from the
 * stored order, never from the request — a caller supplying their own pidx must not
 * be able to steer verification at an unrelated transaction.
 */
export async function verifyKhalti(pidx: string): Promise<VerifyResult> {
  const { secret, base } = config();

  const response = await fetch(`${base}/epayment/lookup/`, {
    method: "POST",
    headers: {
      Authorization: `Key ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pidx }),
  });

  if (!response.ok) {
    return { status: "pending", amountPaisa: null, gatewayTransactionId: null };
  }

  const data = (await response.json()) as {
    status: string;
    total_amount: number;
    transaction_id: string | null;
  };

  // Khalti statuses: Completed, Pending, Initiated, Refunded, Expired, User canceled.
  // Only "Completed" is money received; everything else is explicitly not paid.
  const status =
    data.status === "Completed"
      ? "paid"
      : data.status === "Pending" || data.status === "Initiated"
        ? "pending"
        : "failed";

  return {
    status,
    amountPaisa: typeof data.total_amount === "number" ? data.total_amount : null,
    gatewayTransactionId: data.transaction_id ?? null,
    raw: data,
  };
}
