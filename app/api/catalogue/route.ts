import { NextResponse } from "next/server";
import { TEMPLATES } from "@/lib/templates";
import { SERVICES } from "@/lib/services";
import { PLANS, planPriceNpr, isPlanId } from "@/lib/plans";
import { skuOf } from "@/lib/payments/orders";

/**
 * The price list, in the form Bagisto's catalogue seeder needs.
 *
 * The registry in lib/ stays the single source of truth for what the firm sells and
 * what it costs, and this is how that reaches the shop. The alternative — typing the
 * catalogue into Bagisto by hand, or into PHP — creates a second price list, and the
 * day the two disagree is the day a client is charged something the site did not
 * quote.
 *
 * Public on purpose: every price here is already on /templates and /pricing. It
 * carries no clause text, only titles and prices.
 */

export type CatalogueEntry = {
  sku: string;
  name: string;
  nameNe: string;
  priceNpr: number;
  kind: "document" | "service" | "plan";
};

export function GET() {
  const entries: CatalogueEntry[] = [];

  for (const template of TEMPLATES) {
    entries.push({
      sku: skuOf({ type: "document", slug: template.slug }),
      name: template.title.en,
      nameNe: template.title.ne,
      priceNpr: template.priceNpr,
      kind: "document",
    });
  }

  for (const service of Object.values(SERVICES)) {
    entries.push({
      sku: skuOf({ type: "service", id: service.id }),
      name: service.title.en,
      nameNe: service.title.ne,
      priceNpr: service.priceNpr,
      kind: "service",
    });
  }

  for (const [planId, plan] of Object.entries(PLANS)) {
    if (!isPlanId(planId)) continue;

    for (const period of ["monthly", "annual"] as const) {
      const priceNpr = planPriceNpr(planId, period);
      // The free plan is not purchasable — there is nothing to put in a cart.
      if (priceNpr <= 0) continue;

      entries.push({
        sku: skuOf({ type: "plan", id: planId, period }),
        name: `${plan.name.en} plan — ${period}`,
        nameNe: `${plan.name.ne} योजना — ${period === "annual" ? "वार्षिक" : "मासिक"}`,
        priceNpr,
        kind: "plan",
      });
    }
  }

  return NextResponse.json({ entries });
}
