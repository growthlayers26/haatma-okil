import { describe, it, expect } from "vitest";
import { toBs, fromBs, parseBsString, formatBsShort, todayBs } from "@/lib/bs-date";

describe("Bikram Sambat", () => {
  it("round-trips a date", () => {
    const bs = toBs(new Date("2026-08-29T00:00:00Z"));
    const back = toBs(fromBs(bs));
    expect(back).toEqual(bs);
  });

  it("parses the stored string form", () => {
    expect(parseBsString("2083-05-24")).toEqual({ year: 2083, month: 5, day: 24 });
  });

  it("rejects malformed input rather than guessing", () => {
    // A silently wrong date on a deed is worse than a visibly missing one.
    expect(parseBsString("not-a-date")).toBeNull();
    expect(parseBsString("")).toBeNull();
  });

  it("formats in Devanagari for Nepali", () => {
    const formatted = formatBsShort({ year: 2083, month: 5, day: 24 }, "ne");
    expect(formatted).toMatch(/[०-९]/);
    expect(formatted).not.toMatch(/[0-9]/);
  });

  it("gives a today that is a valid BS date", () => {
    const t = todayBs();
    expect(t.month).toBeGreaterThanOrEqual(1);
    expect(t.month).toBeLessThanOrEqual(12);
    expect(t.day).toBeGreaterThanOrEqual(1);
    expect(t.day).toBeLessThanOrEqual(32);
  });
});
