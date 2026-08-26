import { createHmac } from "node:crypto";
import { GatewayNotConfigured, type Handoff, type VerifyResult, toNpr } from "./types";

/**
 * eSewa ePay v2.
 *
 * The volume rail — eSewa has the widest reach of the Nepali wallets. Unlike Khalti it
 * takes a signed HTML form POST rather than a redirect, so the client auto-submits a
 * form built from these fields.
 *
 * eSewa works in rupees, not paisa, which is the opposite of Khalti. Getting that
 * wrong charges a customer a hundred times the intended amount, so conversion happens
 * here and nowhere else.
 */

const LIVE_FORM = "https://epay.esewa.com.np/api/epay/main/v2/form";
const TEST_FORM = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
const LIVE_STATUS = "https://epay.esewa.com.np/api/epay/transaction/status/";
const TEST_STATUS = "https://rc.esewa.com.np/api/epay/transaction/status/";

function config() {
  const secret = process.env.ESEWA_SECRET_KEY;
  const productCode = process.env.ESEWA_PRODUCT_CODE;
  if (!secret || !productCode) throw new GatewayNotConfigured("esewa");

  const live = process.env.ESEWA_ENV === "live";
  return {
    secret,
    productCode,
    formUrl: live ? LIVE_FORM : TEST_FORM,
    statusUrl: live ? LIVE_STATUS : TEST_STATUS,
  };
}

export function isEsewaConfigured(): boolean {
  return Boolean(process.env.ESEWA_SECRET_KEY && process.env.ESEWA_PRODUCT_CODE);
}

/**
 * eSewa signs a comma-joined `key=value` string over exactly the fields named in
 * `signed_field_names`, in that order. Field order is part of the signature — a
 * different order produces a valid-looking signature that eSewa rejects.
 */
function sign(secret: string, fields: Record<string, string>, signedFieldNames: string[]): string {
  const message = signedFieldNames.map((name) => `${name}=${fields[name]}`).join(",");
  return createHmac("sha256", secret).update(message).digest("base64");
}

export function initiateEsewa(input: {
  orderId: string;
  amountPaisa: number;
  successUrl: string;
  failureUrl: string;
}): Handoff {
  const { secret, productCode, formUrl } = config();

  // eSewa quotes amounts in rupees.
  const amount = toNpr(input.amountPaisa).toFixed(2);

  const fields: Record<string, string> = {
    amount,
    tax_amount: "0",
    total_amount: amount,
    transaction_uuid: input.orderId,
    product_code: productCode,
    product_service_charge: "0",
    product_delivery_charge: "0",
    success_url: input.successUrl,
    failure_url: input.failureUrl,
    signed_field_names: "total_amount,transaction_uuid,product_code",
  };

  fields.signature = sign(secret, fields, [
    "total_amount",
    "transaction_uuid",
    "product_code",
  ]);

  return { mode: "form", action: formUrl, fields, reference: input.orderId };
}

/**
 * Asks eSewa for the real status of a transaction.
 *
 * eSewa also returns a signed payload on the success redirect. That is deliberately
 * not trusted here: this endpoint is the authority, because a redirect can be replayed
 * or forged and a server-to-server lookup cannot.
 */
export async function verifyEsewa(input: {
  orderId: string;
  amountPaisa: number;
}): Promise<VerifyResult> {
  const { productCode, statusUrl } = config();

  const query = new URLSearchParams({
    product_code: productCode,
    total_amount: toNpr(input.amountPaisa).toFixed(2),
    transaction_uuid: input.orderId,
  });

  const response = await fetch(`${statusUrl}?${query.toString()}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    return { status: "pending", amountPaisa: null, gatewayTransactionId: null };
  }

  const data = (await response.json()) as {
    status: string;
    total_amount: number | string;
    ref_id: string | null;
  };

  // eSewa statuses: COMPLETE, PENDING, FULL_REFUND, PARTIAL_REFUND, AMBIGUOUS,
  // NOT_FOUND, CANCELED. Only COMPLETE is money received. AMBIGUOUS deliberately maps
  // to pending, never paid — it means eSewa itself does not yet know.
  const status =
    data.status === "COMPLETE"
      ? "paid"
      : data.status === "PENDING" || data.status === "AMBIGUOUS"
        ? "pending"
        : "failed";

  const reported = Number(data.total_amount);

  return {
    status,
    amountPaisa: Number.isFinite(reported) ? Math.round(reported * 100) : null,
    gatewayTransactionId: data.ref_id ?? null,
    raw: data,
  };
}
