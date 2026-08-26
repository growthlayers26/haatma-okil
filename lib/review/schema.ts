import { z } from "zod";

/**
 * What the model is asked to pull out of a pasted contract.
 *
 * This schema is deliberately confined to OBSERVATIONS — numbers, dates, and
 * whether a clause is present. It contains no field for an opinion, a risk level, or
 * a statutory reference.
 *
 * That split is the whole design. The model reads the document; lib/review/rules.ts
 * decides what the law makes of it, using the constants in lib/nepal.ts. A language
 * model asked to cite a section number will eventually invent one, and an invented
 * citation in a legal product is worse than no product. Here it cannot: every
 * citation the user sees comes from our own reviewed constants.
 */

const nullableNumber = z.number().nullable();

export const EmploymentFactsSchema = z.object({
  monthlySalaryNpr: nullableNumber.describe(
    "Monthly basic salary or remuneration in Nepali rupees. Null if not stated.",
  ),
  probationMonths: nullableNumber.describe("Length of any probation period, in months."),
  weeklyHours: nullableNumber.describe("Stated ordinary working hours per week."),
  dailyHours: nullableNumber.describe("Stated ordinary working hours per day."),
  annualLeaveDays: nullableNumber.describe("Annual/home leave days granted per year."),
  sickLeaveDays: nullableNumber.describe("Paid sick leave days granted per year."),
  noticePeriodDays: nullableNumber.describe("Notice period for termination, in days."),
  overtimeRateMultiplier: nullableNumber.describe(
    "Overtime pay as a multiple of the ordinary rate, e.g. 1.5. Null if not stated.",
  ),
  mentionsSocialSecurityFund: z
    .boolean()
    .describe("Whether the document mentions the Social Security Fund (SSF) at all."),
  isFixedTerm: z.boolean().describe("Whether this is a fixed-term rather than open-ended contract."),
});

export const LeaseFactsSchema = z.object({
  monthlyRentNpr: nullableNumber.describe("Monthly rent in Nepali rupees."),
  depositNpr: nullableNumber.describe("Security deposit held by the landlord."),
  termMonths: nullableNumber.describe("Length of the tenancy in months."),
  noticeDays: nullableNumber.describe("Notice period to end the tenancy, in days."),
  statesDepositReturn: z.boolean().describe("Whether the document says how the deposit is returned."),
  statesRentIncrease: z.boolean().describe("Whether the document governs rent increases."),
});

export const LoanFactsSchema = z.object({
  principalNpr: nullableNumber.describe("Principal amount lent, in Nepali rupees."),
  annualInterestPercent: nullableNumber.describe("Stated annual interest rate as a percentage."),
  repaymentMonths: nullableNumber.describe("Repayment period in months."),
  hasSecurity: z.boolean().describe("Whether any collateral or security is given."),
  statesDefaultConsequence: z.boolean().describe("Whether the document says what happens on default."),
});

/** Clause types worth knowing the presence of, whatever the document is. */
export const CLAUSE_KEYS = [
  "governing_law",
  "dispute_resolution",
  "termination",
  "confidentiality",
  "payment_terms",
  "signature_block",
  "witness_block",
  "date",
] as const;

export const ContractFactsSchema = z.object({
  documentType: z
    .enum(["employment", "lease", "loan", "service", "nda", "partnership", "sale", "other"])
    .describe("Best classification of what this document is."),
  language: z.enum(["ne", "en", "mixed"]).describe("Language the document is written in."),
  partyNames: z.array(z.string()).describe("Names of the parties, as written."),
  governingLawStated: z
    .string()
    .nullable()
    .describe("The governing law named in the document, verbatim. Null if none is named."),

  clausesPresent: z
    .array(z.enum(CLAUSE_KEYS))
    .describe("Which of these clause types are present in the document."),

  employment: EmploymentFactsSchema.nullable().describe(
    "Employment terms. Null unless documentType is employment.",
  ),
  lease: LeaseFactsSchema.nullable().describe("Tenancy terms. Null unless documentType is lease."),
  loan: LoanFactsSchema.nullable().describe("Loan terms. Null unless documentType is loan."),

  /*
   * Passages the model found notable. These are quoted back to the user as the
   * document's own words, never paraphrased into an assertion about the law — a
   * quote the reader can check is a fair thing for software to surface; a
   * characterisation of it is advice.
   */
  notablePassages: z
    .array(
      z.object({
        quote: z.string().describe("The passage, quoted exactly from the document."),
        observation: z
          .string()
          .describe(
            "A neutral factual note about what the passage does. Describe, do not advise, " +
              "and do not state or imply whether it is lawful.",
          ),
      }),
    )
    .describe("Up to six passages a reader should look at closely."),
});

export type ContractFacts = z.infer<typeof ContractFactsSchema>;
export type EmploymentFacts = z.infer<typeof EmploymentFactsSchema>;
export type ClauseKey = (typeof CLAUSE_KEYS)[number];
