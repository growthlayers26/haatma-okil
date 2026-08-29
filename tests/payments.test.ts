import { describe, it, expect } from "vitest";
import { toPaisa, toNpr } from "@/lib/payments/types";
import { priceNprOf } from "@/lib/payments/orders";
import { planPriceNpr, annualSavingPercent, PLANS } from "@/lib/plans";

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
