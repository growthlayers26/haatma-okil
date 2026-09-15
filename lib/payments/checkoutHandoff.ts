import "server-only";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { execute } from "@/lib/db/mysql";

/**
 * Proves to Bagisto who is buying.
 *
 * Bagisto's checkout runs inside its own session — entirely separate from this
 * application's — and a browser can carry a stale session, or one that belongs to
 * a different customer altogether. `legal/buy/{sku}` no longer trusts whatever it
 * finds there: it spends this token instead, confirming (and if necessary
 * correcting) which customer it is signing in as before it touches a cart. See
 * CheckoutController::resolveHandoffCustomer() on the Bagisto side.
 *
 * Only the hash is stored. The raw token lives just long enough to cross the
 * redirect, so a leaked database row grants nothing on its own, and reusing it
 * (a stale bookmark, a replayed request) grants nothing either — Bagisto marks it
 * spent the moment it is read.
 */
export async function mintCheckoutHandoff(customerId: number, sku: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  await execute(
    `INSERT INTO legal_checkout_handoffs (id, customer_id, token_hash, sku, expires_at, created_at)
     VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 2 MINUTE), NOW())`,
    [randomUUID(), customerId, tokenHash, sku],
  );

  return token;
}
