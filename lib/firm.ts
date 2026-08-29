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
  nameEn: "Mandala Law",
  nameNe: "मण्डल ल फर्म",

  /** Shared inbox. Also the From and Reply-To on everything the product sends. */
  email: "mandalalawfirm00@gmail.com",

  /** Not yet supplied. The footer omits each of these until it is. */
  phone: null as string | null,
  address: null as string | null,
} as const;
