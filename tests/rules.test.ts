import { describe, it, expect } from "vitest";
import { evaluate, summarise } from "@/lib/review/rules";
import type { ContractFacts } from "@/lib/review/schema";
import { MIN_MONTHLY_WAGE_NPR, MAX_PROBATION_MONTHS } from "@/lib/nepal";

const ALL_CLAUSES = [
  "governing_law",
  "dispute_resolution",
  "termination",
  "signature_block",
  "witness_block",
  "date",
  "payment_terms",
  "confidentiality",
] as const;

function facts(over: Partial<ContractFacts> = {}): ContractFacts {
  return {
    documentType: "employment",
    language: "en",
    partyNames: ["Acme Pvt Ltd", "Sita Shrestha"],
    governingLawStated: null,
    clausesPresent: [...ALL_CLAUSES],
    employment: {
      monthlySalaryNpr: 30_000,
      probationMonths: 3,
      weeklyHours: 44,
      dailyHours: 8,
      annualLeaveDays: 18,
      sickLeaveDays: 15,
      noticePeriodDays: 30,
      overtimeRateMultiplier: 1.5,
      mentionsSocialSecurityFund: true,
      isFixedTerm: false,
    },
    lease: null,
    loan: null,
    notablePassages: [],
    ...over,
  };
}

describe("contract review rules", () => {
  it("finds nothing wrong with a compliant contract", () => {
    // A false positive here is worse than a missed finding: it teaches users that the
    // breaches are noise.
    expect(summarise(evaluate(facts())).breach).toBe(0);
  });

  it("catches pay below the minimum wage", () => {
    const found = evaluate(
      facts({ employment: { ...facts().employment!, monthlySalaryNpr: MIN_MONTHLY_WAGE_NPR - 1 } }),
    );
    expect(found.some((f) => f.id === "emp-below-minimum-wage" && f.severity === "breach")).toBe(true);
  });

  it("accepts pay exactly at the minimum", () => {
    // The statute sets a floor, not a threshold to exceed. Off-by-one here would
    // accuse a compliant employer.
    const found = evaluate(
      facts({ employment: { ...facts().employment!, monthlySalaryNpr: MIN_MONTHLY_WAGE_NPR } }),
    );
    expect(found.some((f) => f.id === "emp-below-minimum-wage")).toBe(false);
  });

  it("accepts probation exactly at the ceiling and rejects one month more", () => {
    const at = evaluate(
      facts({ employment: { ...facts().employment!, probationMonths: MAX_PROBATION_MONTHS } }),
    );
    const over = evaluate(
      facts({ employment: { ...facts().employment!, probationMonths: MAX_PROBATION_MONTHS + 1 } }),
    );
    expect(at.some((f) => f.id === "emp-probation-too-long")).toBe(false);
    expect(over.some((f) => f.id === "emp-probation-too-long")).toBe(true);
  });

  it("treats an absent figure as unknown rather than compliant", () => {
    // Null must never be read as zero — that would report every silent contract as
    // paying below minimum wage.
    const found = evaluate(
      facts({ employment: { ...facts().employment!, monthlySalaryNpr: null } }),
    );
    expect(found.some((f) => f.id === "emp-below-minimum-wage")).toBe(false);
    expect(found.some((f) => f.id === "emp-salary-absent" && f.severity === "missing")).toBe(true);
  });

  it("never asserts that anything is unlawful", () => {
    // Only a licensed advocate may advise. The findings are questions.
    const found = evaluate(
      facts({ employment: { ...facts().employment!, monthlySalaryNpr: 5_000, weeklyHours: 70 } }),
    );
    const prose = found.map((f) => `${f.title.en} ${f.detail.en} ${f.ask.en}`).join(" ");
    expect(prose).not.toMatch(/\b(illegal|unlawful|void|invalid|you must)\b/i);
  });

  it("carries a citation on every finding", () => {
    const found = evaluate(facts({ clausesPresent: [] }));
    expect(found.length).toBeGreaterThan(0);
    expect(found.every((f) => f.citation !== null)).toBe(true);
  });

  it("sorts breaches above everything else", () => {
    const found = evaluate(
      facts({ clausesPresent: [], employment: { ...facts().employment!, sickLeaveDays: 2 } }),
    );
    const rank = { breach: 0, missing: 1, check: 2 } as const;
    const order = found.map((f) => rank[f.severity]);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("raises a foreign governing law as a question, not a fault", () => {
    const found = evaluate(facts({ governingLawStated: "the laws of Singapore" }));
    const item = found.find((f) => f.id === "foreign-governing-law");
    expect(item?.severity).toBe("check");
  });
});
