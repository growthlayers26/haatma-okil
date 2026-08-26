import type { Citation } from "./types";

/**
 * Statutory constants that templates validate against.
 *
 * These are the values that change when Parliament amends an act or the Ministry
 * revises the minimum wage. They live in one file so an amendment is a single edit
 * plus a template review, never a search through clause bodies.
 *
 * Every value here requires confirmation by a Bar Council–licensed advocate at the
 * firm before the template that depends on it is published.
 */

export const ACTS = {
  civilCode: { act: { ne: "मुलुकी देवानी संहिता, २०७४", en: "Muluki Civil Code, 2074" } },
  labour: { act: { ne: "श्रम ऐन, २०७४", en: "Labour Act, 2074" } },
  companies: { act: { ne: "कम्पनी ऐन, २०६३", en: "Companies Act, 2063" } },
  electronic: {
    act: { ne: "विद्युतीय कारोबार ऐन, २०६३", en: "Electronic Transactions Act, 2063" },
  },
  partnership: { act: { ne: "साझेदारी ऐन, २०२०", en: "Partnership Act, 2020" } },
  criminalCode: { act: { ne: "मुलुकी अपराध संहिता, २०७४", en: "Muluki Criminal Code, 2074" } },
  civilProcedure: {
    act: { ne: "मुलुकी देवानी कार्यविधि संहिता, २०७४", en: "Muluki Civil Procedure Code, 2074" },
  },
  patentDesign: {
    act: { ne: "पेटेन्ट, डिजाइन र ट्रेडमार्क ऐन, २०२२", en: "Patent, Design and Trade Mark Act, 2022" },
  },
  incomeTax: { act: { ne: "आयकर ऐन, २०५८", en: "Income Tax Act, 2058" } },
  vat: { act: { ne: "मूल्य अभिवृद्धि कर ऐन, २०५२", en: "Value Added Tax Act, 2052" } },
} as const;

export function cite(
  base: { act: { ne: string; en: string } },
  ne: string,
  en: string,
): Citation {
  return { act: base.act, section: { ne, en } };
}

/** Contract formation. MCC 2074 §504 defines an enforceable agreement. */
export const CONTRACT = cite(ACTS.civilCode, "दफा ५०४", "§504");
export const LEASE = cite(ACTS.civilCode, "दफा ५८३", "§583");
export const LOAN = cite(ACTS.civilCode, "दफा ५६२", "§562");

/*
 * Subject-level citations.
 *
 * Where the exact section is not confirmed, the citation names the Act and the subject
 * rather than a number. A wrong section number reads as authoritative and is more
 * dangerous than an absent one — the reviewing advocate pins these down before launch.
 */
export const AGENCY = cite(
  ACTS.civilCode,
  "अख्तियारनामा सम्बन्धी व्यवस्था",
  "provisions on power of attorney",
);
export const SUCCESSION = cite(
  ACTS.civilCode,
  "इच्छापत्र तथा हकवाला सम्बन्धी व्यवस्था",
  "provisions on wills and succession",
);
export const SALE = cite(ACTS.civilCode, "किनबेच सम्बन्धी व्यवस्था", "provisions on sale");
export const AGENCY_SERVICE = cite(
  ACTS.civilCode,
  "सेवा करार सम्बन्धी व्यवस्था",
  "provisions on contracts for services",
);
export const PARTNERSHIP = cite(
  ACTS.partnership,
  "साझेदारी दर्ता सम्बन्धी व्यवस्था",
  "provisions on partnership registration",
);
export const TRADEMARK = cite(
  ACTS.patentDesign,
  "ट्रेडमार्क दर्ता सम्बन्धी व्यवस्था",
  "provisions on trade mark registration",
);
export const DIGITAL_SIGNATURE = cite(
  ACTS.electronic,
  "विद्युतीय हस्ताक्षर सम्बन्धी व्यवस्था",
  "provisions on digital signatures",
);

/** Labour Act 2074 provisions used by the employment template. */
export const LABOUR = {
  writtenContract: cite(ACTS.labour, "दफा ११", "§11"),
  probation: cite(ACTS.labour, "दफा १४", "§14"),
  workingHours: cite(ACTS.labour, "दफा २८", "§28"),
  overtime: cite(ACTS.labour, "दफा ३१", "§31"),
  leave: cite(ACTS.labour, "दफा ४१–४९", "§41–49"),
  remuneration: cite(ACTS.labour, "दफा ३४", "§34"),
  termination: cite(ACTS.labour, "दफा १४५", "§145"),
} as const;

/**
 * Minimum monthly remuneration set by the Ministry of Labour.
 * REVIEW: reconfirm each time the minimum wage notice is revised.
 */
export const MIN_MONTHLY_WAGE_NPR = 17_300;

/** Maximum probation period permitted before an employee becomes permanent. */
export const MAX_PROBATION_MONTHS = 6;

export const MAX_DAILY_HOURS = 8;
export const MAX_WEEKLY_HOURS = 48;
export const OVERTIME_MULTIPLIER = 1.5;

/**
 * Statutory leave floors. A contract may grant more; it may never grant less,
 * so the wizard renders these as locked rather than as editable fields.
 */
export const LEAVE_FLOOR = {
  /** One day accrued per twenty days worked. */
  annualPerDaysWorked: { days: 1, per: 20 },
  sickDaysPerYear: 12,
  maternityDays: 98,
  paternityDays: 15,
  mourningDays: 13,
} as const;

/** Social Security Fund contribution rates, as a share of basic remuneration. */
export const SSF = {
  employeePercent: 11,
  employerPercent: 20,
} as const;

/** Private limited company thresholds under the Companies Act 2063. */
export const COMPANY = {
  minPaidUpCapitalNpr: 100_000,
  minShareholders: 1,
  registrationFeeNpr: 1_000,
} as const;

export const CURRENCY = { ne: "रु.", en: "NPR" } as const;

/**
 * Money for display. Nepali output uses Devanagari numerals and the lakh grouping
 * (1,00,000 — not 100,000), which is what a reader of an executed document expects.
 */
export function formatNpr(amount: number, lang: "ne" | "en" = "en"): string {
  const s = Math.round(amount).toString();
  const grouped =
    s.length <= 3
      ? s
      : `${s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${s.slice(-3)}`;
  const digits = lang === "ne" ? toNepaliDigits(grouped) : grouped;
  return `${CURRENCY[lang]} ${digits}`;
}

const NE_DIGITS = "०१२३४५६७८९";

/** Convert ASCII digits to Devanagari numerals for Nepali-language output. */
export function toNepaliDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => NE_DIGITS[Number(d)]);
}
