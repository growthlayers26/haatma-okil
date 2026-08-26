export type Gateway = "khalti" | "esewa" | "fonepay" | "card";

/**
 * How the browser hands off to the gateway.
 *
 * Khalti returns a URL to redirect to. eSewa requires a signed HTML form POST, so the
 * client renders and auto-submits a form rather than following a link.
 */
export type Handoff =
  | { mode: "redirect"; url: string; reference: string }
  | { mode: "form"; action: string; fields: Record<string, string>; reference: string };

export type VerifyResult = {
  /** `paid` is the only state that releases a document. */
  status: "paid" | "pending" | "failed";
  /** Amount the gateway says it actually took, in paisa. Compared against the order. */
  amountPaisa: number | null;
  gatewayTransactionId: string | null;
  raw?: unknown;
};

export class GatewayNotConfigured extends Error {
  constructor(gateway: Gateway) {
    super(`${gateway} is not configured`);
    this.name = "GatewayNotConfigured";
  }
}

/** Nepali gateways work in paisa. Storing integers avoids float drift on money. */
export const toPaisa = (npr: number) => Math.round(npr * 100);
export const toNpr = (paisa: number) => paisa / 100;
