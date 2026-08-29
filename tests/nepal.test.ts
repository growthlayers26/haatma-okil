import { describe, it, expect } from "vitest";
import {
  formatNpr,
  toNepaliDigits,
  MIN_MONTHLY_WAGE_NPR,
  MAX_PROBATION_MONTHS,
  MAX_WEEKLY_HOURS,
  LEAVE_FLOOR,
  SSF,
  COMPANY,
} from "@/lib/nepal";

describe("money", () => {
  it("groups in lakhs, not thousands", () => {
    // 8,500,000 is written 85,00,000 in Nepal. Getting this wrong misstates a land
    // price by an order of magnitude on the face of a deed.
    expect(formatNpr(8_500_000)).toBe("NPR 85,00,000");
    expect(formatNpr(100_000)).toBe("NPR 1,00,000");
    expect(formatNpr(1_000)).toBe("NPR 1,000");
    expect(formatNpr(999)).toBe("NPR 999");
  });

  it("uses Devanagari numerals in Nepali", () => {
    expect(formatNpr(1_00_000, "ne")).toBe("रु. १,००,०००");
  });

  it("rounds rather than truncating", () => {
    expect(formatNpr(599.6)).toBe("NPR 600");
  });
});

describe("Devanagari digits", () => {
  it("converts every digit and leaves the rest alone", () => {
    expect(toNepaliDigits("2083-05-24")).toBe("२०८३-०५-२४");
    expect(toNepaliDigits(0)).toBe("०");
  });
});

describe("statutory constants", () => {
  /*
   * These are asserted not because arithmetic might break, but because a silent edit
   * to one of them changes what every document in the catalogue asserts about the
   * law. A failing test here should send someone to the Gazette, not to the code.
   */
  it("holds the values the templates were written against", () => {
    expect(MIN_MONTHLY_WAGE_NPR).toBe(17_300);
    expect(MAX_PROBATION_MONTHS).toBe(6);
    expect(MAX_WEEKLY_HOURS).toBe(48);
    expect(LEAVE_FLOOR.sickDaysPerYear).toBe(12);
    expect(LEAVE_FLOOR.maternityDays).toBe(98);
    expect(SSF.employeePercent).toBe(11);
    expect(SSF.employerPercent).toBe(20);
    expect(COMPANY.minPaidUpCapitalNpr).toBe(100_000);
    expect(COMPANY.minShareholders).toBe(1);
  });
});
