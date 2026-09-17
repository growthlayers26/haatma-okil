/**
 * The firm's own details.
 *
 * Held in one place because they appear in three unrelated contexts — the footer, the
 * address outbound mail is sent from, and the address a client replies to — and a
 * firm that changes its inbox should change it once.
 *
 * Only what the firm has actually supplied is here. A phone number or a street
 * address invented to fill a layout would be a false representation on a law firm's
 * own site, which is a worse problem than an incomplete footer.
 */
export const FIRM = {
  nameEn: "Haatma Okil",
  nameNe: "हातमा वकिल",

  /**
   * Shared inbox. Also the From and Reply-To on everything the product sends —
   * see SENDER_ADDRESS in lib/notify.ts, which refuses to dispatch mail at all
   * while this is unset rather than send it with nowhere for a client to reply.
   *
   * Not yet supplied. "mandalalawfirm00@gmail.com" was never this firm's own
   * inbox — the same class of leftover placeholder as the Vercel favicon and
   * the Webkul copyright line found and removed earlier.
   */
  email: null as string | null,

  /**
   * Practising advocates at the firm.
   *
   * Duplicated from the advocates table on purpose: the homepage renders without a
   * database configured, so it cannot count rows. MUST be kept in step with
   * supabase/migrations — a figure claiming more advocates than the firm has is a
   * misrepresentation, not a stale cache.
   */
  advocateCount: 3,

  /** Not yet supplied. The footer omits each of these until it is. */
  phone: null as string | null,
  address: null as string | null,
} as const;
