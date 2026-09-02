import { describe, it, expect } from "vitest";
import { toPaisa, toNpr } from "@/lib/payments/types";
import { priceNprOf, meaningOfSku, skuOf } from "@/lib/payments/catalogue";
import { planPriceNpr, annualSavingPercent, PLANS } from "@/lib/plans";
import { TEMPLATES } from "@/lib/templates";

describe("currency units", () => {
  /*
   * Khalti quotes paisa and eSewa quotes rupees. Confusing the two charges a
   * customer a hundred times the intended amount, which is the single most expensive
   * mistake available in this codebase.
   */
  it("converts without floating-point drift", () => {
    expect(toPaisa(599)).toBe(59_900);
    expect(toPaisa(0.1)).toBe(10);
    expect(toPaisa(1234.56)).toBe(123_456);
    expect(toNpr(59_900)).toBe(599);
  });

  it("rounds to whole paisa rather than carrying a fraction to the gateway", () => {
    expect(Number.isInteger(toPaisa(19.999))).toBe(true);
  });
});

describe("server-side pricing", () => {
  it("prices a document from the registry", () => {
    expect(priceNprOf({ type: "document", slug: "employment-contract" })).toBe(599);
  });

  it("adds advocate review as a separate line", () => {
    const plain = priceNprOf({ type: "document", slug: "employment-contract" })!;
    const reviewed = priceNprOf({
      type: "document",
      slug: "employment-contract",
      advocateReview: true,
    })!;
    expect(reviewed - plain).toBe(2_500);
  });

  it("refuses an unknown slug rather than charging zero", () => {
    expect(priceNprOf({ type: "document", slug: "not-a-real-template" })).toBeNull();
  });

  it("refuses to sell the free plan", () => {
    expect(priceNprOf({ type: "plan", id: "free", period: "annual" })).toBeNull();
  });
});

describe("plan pricing", () => {
  it("prices both periods", () => {
    expect(planPriceNpr("business", "annual")).toBe(7_999);
    expect(planPriceNpr("business", "monthly")).toBe(799);
  });

  it("derives the annual saving so the two prices cannot drift apart", () => {
    const p = PLANS.business;
    const expected = Math.round(((p.monthlyNpr * 12 - p.annualNpr) / (p.monthlyNpr * 12)) * 100);
    expect(annualSavingPercent("business")).toBe(expected);
  });

  it("reports no saving on a free plan rather than dividing by zero", () => {
    expect(annualSavingPercent("free")).toBe(0);
  });
});

describe("what a SKU entitles its buyer to", () => {
  /*
   * This is a regression test for a silent downgrade. meaningOfSku derived the kind
   * with a ternary that fell through to "question", so the three filing services —
   * company registration at NPR 9,999, trademark at NPR 12,999, tax registration —
   * each granted the NPR 1,500 written-question entitlement, which anything asking
   * for a question would then spend. Nothing failed; the customer just silently
   * received something cheaper than what they paid for.
   */
  it("does not downgrade a filing service into a written question", () => {
    for (const id of ["company_registration", "trademark", "tax_registration"] as const) {
      const meaning = meaningOfSku(`svc-${id}`);
      expect(meaning?.kind).toBe("filing");
      // The kind alone is too coarse: the three filings are not interchangeable, so
      // the exact service has to survive onto the entitlement.
      expect(meaning?.serviceId).toBe(id);
    }
  });

  it("keeps the metered services distinct from one another", () => {
    expect(meaningOfSku("svc-question")?.kind).toBe("question");
    expect(meaningOfSku("svc-consultation")?.kind).toBe("consultation");
    expect(meaningOfSku("svc-document_review")?.kind).toBe("review");
  });

  it("reads a document SKU back to a real template, and refuses an invented one", () => {
    expect(meaningOfSku("doc-employment-contract")?.kind).toBe("document");
    expect(meaningOfSku("doc-not-a-template")).toBeNull();
    expect(meaningOfSku("something-else")).toBeNull();
  });

  it("carries the plan and period a subscription SKU names", () => {
    const annual = meaningOfSku("plan-business-annual");
    expect(annual?.kind).toBe("subscription");
    expect(annual?.planId).toBe("business");
    expect(annual?.period).toBe("annual");
    // "free" costs nothing, so it is never sold and never redeemed.
    expect(meaningOfSku("plan-business-weekly")).toBeNull();
  });

  it("round-trips every template in the registry through its own SKU", () => {
    // Driven from TEMPLATES rather than a hand-written list, so a template added
    // later is covered without anyone remembering to add it here — and so a slug
    // that stops existing fails loudly instead of quietly testing nothing.
    expect(TEMPLATES.length).toBeGreaterThan(0);

    for (const template of TEMPLATES) {
      const sku = skuOf({ type: "document", slug: template.slug });
      expect(meaningOfSku(sku)?.kind).toBe("document");
    }
  });
});
