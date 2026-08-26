import NepaliDateLib from "nepali-date-converter";
import { toNepaliDigits } from "./nepal";
import type { Lang } from "./types";

/**
 * Bikram Sambat is the calendar Nepali instruments are executed and dated in, and
 * fiscal and filing deadlines are BS-native. Conversion is delegated to a maintained
 * library rather than a hand-written month table: BS month lengths vary per year with
 * no closed-form rule, and a wrong date on an executed contract is a legal defect.
 */

const NepaliDate = NepaliDateLib as unknown as typeof NepaliDateLib;

export const BS_MONTHS: { ne: string; en: string }[] = [
  { ne: "बैशाख", en: "Baishakh" },
  { ne: "जेठ", en: "Jestha" },
  { ne: "असार", en: "Ashadh" },
  { ne: "श्रावण", en: "Shrawan" },
  { ne: "भाद्र", en: "Bhadra" },
  { ne: "आश्विन", en: "Ashwin" },
  { ne: "कार्तिक", en: "Kartik" },
  { ne: "मंसिर", en: "Mangsir" },
  { ne: "पुष", en: "Poush" },
  { ne: "माघ", en: "Magh" },
  { ne: "फाल्गुन", en: "Falgun" },
  { ne: "चैत्र", en: "Chaitra" },
];

export type BsDate = { year: number; month: number; day: number };

const pad = (n: number) => String(n).padStart(2, "0");

/** Gregorian Date to BS. `month` is returned 1-indexed. */
export function toBs(date: Date = new Date()): BsDate {
  const n = new NepaliDate(date);
  return { year: n.getYear(), month: n.getMonth() + 1, day: n.getDate() };
}

export function fromBs({ year, month, day }: BsDate): Date {
  return new NepaliDate(year, month - 1, day).toJsDate();
}

/** ISO-shaped BS string, e.g. "2083-05-10". This is the storage format. */
export function toBsString(date: Date = new Date()): string {
  const { year, month, day } = toBs(date);
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function parseBsString(value: string): BsDate | null {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value.trim());
  if (!m) return null;
  const [, y, mo, d] = m;
  const parsed = { year: Number(y), month: Number(mo), day: Number(d) };
  if (parsed.month < 1 || parsed.month > 12) return null;
  if (parsed.day < 1 || parsed.day > 32) return null;
  return parsed;
}

/**
 * Long form for document bodies: "१० भाद्र २०८३" in Nepali, "10 Bhadra 2083" in English.
 * Nepali output uses Devanagari numerals, which is what an executed document expects.
 */
export function formatBsLong(bs: BsDate, lang: Lang): string {
  const month = BS_MONTHS[bs.month - 1];
  if (lang === "ne") {
    return `${toNepaliDigits(bs.day)} ${month.ne} ${toNepaliDigits(bs.year)}`;
  }
  return `${bs.day} ${month.en} ${bs.year}`;
}

/** Compact form for lists and metadata: "२०८३/०५/१०" or "2083/05/10". */
export function formatBsShort(bs: BsDate, lang: Lang): string {
  const s = `${bs.year}/${pad(bs.month)}/${pad(bs.day)}`;
  return lang === "ne" ? toNepaliDigits(s) : s;
}

export function todayBs(): BsDate {
  return toBs(new Date());
}

/** Gregorian counterpart, shown as secondary on compliance dates. */
export function bsToGregorianLabel(bs: BsDate): string {
  return fromBs(bs).toISOString().slice(0, 10);
}
