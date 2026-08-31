import { getTemplate } from "@/lib/templates";
import { SERVICES, type ServiceId } from "@/lib/services";
import { PLANS, planPriceNpr, type PlanId, type BillingPeriod } from "@/lib/plans";

/**
 * What the firm sells, what it costs, and what a sale entitles someone to.
 *
 * Deliberately free of any database access, and therefore free of `server-only`. This
 * is the half of the old orders.ts that is pure computation over the code registry —
 * splitting it out means the pricing rules can be unit tested, and that the one
 * function nobody should get wrong (priceNprOf, which is why a client cannot post its
 * own amount) is covered by tests rather than only exercised through a checkout.
 */

export type PurchaseItem =
  | { type: "document"; slug: string; advocateReview?: boolean }
  | { type: "service"; id: ServiceId }
  | { type: "plan"; id: PlanId; period: BillingPeriod };

const ADVOCATE_REVIEW_NPR = 2_500;

/**
 * The price of an item, computed server-side from the registry.
 *
 * Deliberately takes no amount from the caller. A client that posts `amountNpr: 1`
 * for a NPR 599 document must not be able to buy it.
 */
export function priceNprOf(item: PurchaseItem): number | null {
  if (item.type === "plan") {
    // The free plan is not purchasable — there is nothing to charge for.
    const price = planPriceNpr(item.id, item.period);
    return price > 0 ? price : null;
  }
  if (item.type === "service") {
    return SERVICES[item.id]?.priceNpr ?? null;
  }
  const template = getTemplate(item.slug);
  if (!template) return null;
  return template.priceNpr + (item.advocateReview ? ADVOCATE_REVIEW_NPR : 0);
}

export function describeItem(item: PurchaseItem): string {
  if (item.type === "plan") {
    const plan = PLANS[item.id];
    return plan ? `${plan.name.en} plan (${item.period})` : "Subscription";
  }
  if (item.type === "service") return SERVICES[item.id]?.title.en ?? "Legal service";
  return getTemplate(item.slug)?.title.en ?? "Legal document";
}

/* ------------------------------------------------------------------ catalogue */

/**
 * The SKU a purchasable item carries in Bagisto's catalogue.
 *
 * The SKU is the join between the two halves of the system: Bagisto sells a product,
 * and this is how the application works out what that sale entitles someone to. It is
 * derived rather than stored so the catalogue can be rebuilt from the code registry
 * at any time — see the SeedCatalogue command in the LegalDesk package.
 */
export function skuOf(item: PurchaseItem): string {
  if (item.type === "plan") return `plan-${item.id}-${item.period}`;
  if (item.type === "service") return `svc-${item.id}`;
  return `doc-${item.slug}`;
}

export type EntitlementKind = "document" | "review" | "question" | "consultation" | "subscription";

type SkuMeaning =
  | { kind: EntitlementKind; planId?: PlanId; period?: BillingPeriod }
  | null;

/** What a SKU entitles its buyer to, or null if it is not one of ours. */
export function meaningOfSku(sku: string): SkuMeaning {
  if (sku.startsWith("doc-")) {
    return getTemplate(sku.slice(4)) ? { kind: "document" } : null;
  }

  if (sku.startsWith("svc-")) {
    const id = sku.slice(4) as ServiceId;
    if (!SERVICES[id]) return null;
    // A paid consultation and a paid written question are not interchangeable, so
    // the service id maps straight through rather than collapsing to one kind.
    const kind: EntitlementKind =
      id === "document_review" ? "review" : id === "consultation" ? "consultation" : "question";
    return { kind };
  }

  if (sku.startsWith("plan-")) {
    const [, planId, period] = sku.split("-");
    if (!planId || !period) return null;
    if (!(planId in PLANS)) return null;
    if (period !== "monthly" && period !== "annual") return null;
    return { kind: "subscription", planId: planId as PlanId, period };
  }

  return null;
}
