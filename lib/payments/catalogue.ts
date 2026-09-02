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

export type EntitlementKind =
  | "document"
  | "review"
  | "question"
  | "consultation"
  | "filing"
  | "subscription";

type SkuMeaning =
  | { kind: EntitlementKind; serviceId?: ServiceId; planId?: PlanId; period?: BillingPeriod }
  | null;

/**
 * Which kind of entitlement each service grants.
 *
 * Written out per service rather than derived, because the derivation is what went
 * wrong: a fallthrough mapped every unlisted service to `question`, so the three
 * filing services — company registration at NPR 9,999, trademark at NPR 12,999, tax
 * registration — each granted the NPR 1,500 written-question entitlement, which
 * anything asking for a question would then spend.
 *
 * An exhaustive record means adding a service to lib/services.ts without deciding
 * what it grants is a type error rather than a silent downgrade.
 */
const SERVICE_ENTITLEMENT: Record<ServiceId, EntitlementKind> = {
  question: "question",
  consultation: "consultation",
  document_review: "review",
  company_registration: "filing",
  trademark: "filing",
  tax_registration: "filing",
};

/** What a SKU entitles its buyer to, or null if it is not one of ours. */
export function meaningOfSku(sku: string): SkuMeaning {
  if (sku.startsWith("doc-")) {
    return getTemplate(sku.slice(4)) ? { kind: "document" } : null;
  }

  if (sku.startsWith("svc-")) {
    const id = sku.slice(4) as ServiceId;
    if (!SERVICES[id]) return null;

    /*
     * The service id is carried alongside the kind, not collapsed into it. The three
     * filing services share a kind and are not interchangeable with one another, so
     * claiming one has to match the exact service.
     */
    return { kind: SERVICE_ENTITLEMENT[id], serviceId: id };
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
