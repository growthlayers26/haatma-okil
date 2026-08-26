import type { Bilingual, Citation } from "../types";
import {
  LABOUR,
  LEASE,
  LOAN,
  CONTRACT,
  MIN_MONTHLY_WAGE_NPR,
  MAX_PROBATION_MONTHS,
  MAX_DAILY_HOURS,
  MAX_WEEKLY_HOURS,
  OVERTIME_MULTIPLIER,
  LEAVE_FLOOR,
  SSF,
  formatNpr,
} from "../nepal";
import type { ContractFacts, ClauseKey } from "./schema";

/**
 * The legal judgement layer.
 *
 * Every finding below is produced by deterministic code comparing an extracted
 * number against a constant in lib/nepal.ts, and every citation is taken from that
 * same reviewed file. The model never supplies a section number, a severity, or a
 * conclusion — so none of those can be hallucinated.
 *
 * Framing is deliberate throughout. A finding says what to ASK an advocate, never
 * what the law concludes: only a Bar Council–licensed advocate may advise, and
 * software that tells a user their contract "is illegal" is doing exactly that.
 * `breach` is the strongest word used here, and it means "this figure sits outside a
 * statutory floor we hold as a constant" — which is arithmetic, not advice.
 */

export type Severity = "breach" | "missing" | "check";

export type Finding = {
  id: string;
  severity: Severity;
  title: Bilingual;
  /** What the document says, factually. */
  detail: Bilingual;
  /** The question to put to an advocate. Never a conclusion. */
  ask: Bilingual;
  citation: Citation | null;
};

const ne = (n: number) => String(n);

/* ------------------------------------------------------------------ employment */

function employmentFindings(f: NonNullable<ContractFacts["employment"]>): Finding[] {
  const out: Finding[] = [];

  if (f.monthlySalaryNpr === null) {
    out.push({
      id: "emp-salary-absent",
      severity: "missing",
      title: { ne: "तलब उल्लेख छैन", en: "No salary stated" },
      detail: {
        ne: "कागजातमा मासिक पारिश्रमिकको रकम भेटिएन।",
        en: "No monthly remuneration figure was found in the document.",
      },
      ask: {
        ne: "पारिश्रमिक नखुलेको करार श्रम ऐनको दृष्टिले पर्याप्त हुन्छ कि हुँदैन?",
        en: "Ask whether a contract silent on remuneration meets the Labour Act's requirements.",
      },
      citation: LABOUR.remuneration,
    });
  } else if (f.monthlySalaryNpr < MIN_MONTHLY_WAGE_NPR) {
    out.push({
      id: "emp-below-minimum-wage",
      severity: "breach",
      title: { ne: "न्यूनतम पारिश्रमिकभन्दा कम", en: "Below the minimum wage we hold on file" },
      detail: {
        ne: `कागजातमा मासिक ${formatNpr(f.monthlySalaryNpr, "ne")} उल्लेख छ। हामीसँग अभिलेख रहेको न्यूनतम मासिक पारिश्रमिक ${formatNpr(MIN_MONTHLY_WAGE_NPR, "ne")} हो।`,
        en: `The document states ${formatNpr(f.monthlySalaryNpr)} a month. The minimum monthly remuneration we hold on file is ${formatNpr(MIN_MONTHLY_WAGE_NPR)}.`,
      },
      ask: {
        ne: "हालको न्यूनतम पारिश्रमिक सूचना के हो र यो रकम सो भन्दा कम हो कि होइन?",
        en: "Ask what the current minimum wage notice says, and whether this figure falls below it.",
      },
      citation: LABOUR.remuneration,
    });
  }

  if (f.probationMonths !== null && f.probationMonths > MAX_PROBATION_MONTHS) {
    out.push({
      id: "emp-probation-too-long",
      severity: "breach",
      title: { ne: "परीक्षणकाल तोकिएको हदभन्दा लामो", en: "Probation longer than the statutory ceiling" },
      detail: {
        ne: `कागजातमा ${ne(f.probationMonths)} महिनाको परीक्षणकाल छ। हामीसँग अभिलेख रहेको अधिकतम हद ${ne(MAX_PROBATION_MONTHS)} महिना हो।`,
        en: `The document sets a probation of ${f.probationMonths} months. The ceiling we hold on file is ${MAX_PROBATION_MONTHS} months.`,
      },
      ask: {
        ne: "तोकिएको हदभन्दा लामो परीक्षणकालको के असर पर्दछ?",
        en: "Ask what follows from a probation period set beyond the statutory ceiling.",
      },
      citation: LABOUR.probation,
    });
  }

  if (f.weeklyHours !== null && f.weeklyHours > MAX_WEEKLY_HOURS) {
    out.push({
      id: "emp-weekly-hours",
      severity: "breach",
      title: { ne: "साप्ताहिक कार्यघण्टा बढी", en: "Weekly hours above the statutory limit" },
      detail: {
        ne: `कागजातमा साप्ताहिक ${ne(f.weeklyHours)} घण्टा उल्लेख छ। अभिलेखित सीमा ${ne(MAX_WEEKLY_HOURS)} घण्टा हो।`,
        en: `The document states ${f.weeklyHours} hours a week. The limit we hold on file is ${MAX_WEEKLY_HOURS} hours.`,
      },
      ask: {
        ne: "यो घण्टा ओभरटाइम गनिन्छ कि सामान्य कार्यघण्टा?",
        en: "Ask whether these hours count as overtime rather than ordinary hours.",
      },
      citation: LABOUR.workingHours,
    });
  }

  if (f.dailyHours !== null && f.dailyHours > MAX_DAILY_HOURS) {
    out.push({
      id: "emp-daily-hours",
      severity: "breach",
      title: { ne: "दैनिक कार्यघण्टा बढी", en: "Daily hours above the statutory limit" },
      detail: {
        ne: `कागजातमा दैनिक ${ne(f.dailyHours)} घण्टा उल्लेख छ। अभिलेखित सीमा ${ne(MAX_DAILY_HOURS)} घण्टा हो।`,
        en: `The document states ${f.dailyHours} hours a day. The limit we hold on file is ${MAX_DAILY_HOURS} hours.`,
      },
      ask: {
        ne: "दैनिक सीमाभन्दा बढी काम गराउँदा के व्यवस्था लागू हुन्छ?",
        en: "Ask what applies when daily hours exceed the statutory limit.",
      },
      citation: LABOUR.workingHours,
    });
  }

  if (f.overtimeRateMultiplier !== null && f.overtimeRateMultiplier < OVERTIME_MULTIPLIER) {
    out.push({
      id: "emp-overtime-rate",
      severity: "breach",
      title: { ne: "ओभरटाइम दर कम", en: "Overtime rate below the statutory multiple" },
      detail: {
        ne: `कागजातमा ओभरटाइम दर ${ne(f.overtimeRateMultiplier)} गुणा छ। अभिलेखित दर ${ne(OVERTIME_MULTIPLIER)} गुणा हो।`,
        en: `The document sets overtime at ${f.overtimeRateMultiplier}×. The rate we hold on file is ${OVERTIME_MULTIPLIER}×.`,
      },
      ask: {
        ne: "ओभरटाइमको कानुनी दर के हो?",
        en: "Ask what the statutory overtime rate is and whether this clause meets it.",
      },
      citation: LABOUR.overtime,
    });
  }

  if (f.sickLeaveDays !== null && f.sickLeaveDays < LEAVE_FLOOR.sickDaysPerYear) {
    out.push({
      id: "emp-sick-leave",
      severity: "breach",
      title: { ne: "बिरामी बिदा तोकिएभन्दा कम", en: "Sick leave below the statutory floor" },
      detail: {
        ne: `कागजातमा वार्षिक ${ne(f.sickLeaveDays)} दिन बिरामी बिदा छ। अभिलेखित न्यूनतम ${ne(LEAVE_FLOOR.sickDaysPerYear)} दिन हो।`,
        en: `The document grants ${f.sickLeaveDays} sick days a year. The floor we hold on file is ${LEAVE_FLOOR.sickDaysPerYear} days.`,
      },
      ask: {
        ne: "करारले कानुनी न्यूनतमभन्दा कम बिदा दिन सक्दछ?",
        en: "Ask whether a contract can grant less leave than the statutory floor.",
      },
      citation: LABOUR.leave,
    });
  }

  if (!f.mentionsSocialSecurityFund) {
    out.push({
      id: "emp-ssf-absent",
      severity: "missing",
      title: { ne: "सामाजिक सुरक्षा कोषको उल्लेख छैन", en: "No mention of the Social Security Fund" },
      detail: {
        ne: `कागजातमा सामाजिक सुरक्षा कोष सम्बन्धी कुनै व्यवस्था भेटिएन। सामान्यतया कर्मचारीतर्फ ${ne(SSF.employeePercent)}% र रोजगारदातातर्फ ${ne(SSF.employerPercent)}% योगदान हुन्छ।`,
        en: `The document says nothing about the Social Security Fund. Contributions are ordinarily ${SSF.employeePercent}% from the employee and ${SSF.employerPercent}% from the employer.`,
      },
      ask: {
        ne: "यो रोजगारीमा सामाजिक सुरक्षा कोषमा दर्ता अनिवार्य हो?",
        en: "Ask whether SSF registration is required for this employment, and who bears what.",
      },
      citation: LABOUR.remuneration,
    });
  }

  return out;
}

/* ------------------------------------------------------------------ lease */

function leaseFindings(f: NonNullable<ContractFacts["lease"]>): Finding[] {
  const out: Finding[] = [];

  if (!f.statesDepositReturn && f.depositNpr !== null) {
    out.push({
      id: "lease-deposit-return",
      severity: "missing",
      title: { ne: "धरौटी फिर्ताको व्यवस्था छैन", en: "No mechanism for returning the deposit" },
      detail: {
        ne: `${formatNpr(f.depositNpr, "ne")} धरौटी लिइएको छ तर कहिले र कसरी फिर्ता हुने भन्ने खुलेको छैन।`,
        en: `A deposit of ${formatNpr(f.depositNpr)} is taken, but the document does not say when or how it is returned.`,
      },
      ask: {
        ne: "धरौटी फिर्ताको सर्त नखुलेको सम्झौतामा बहालवालाको हक कसरी सुरक्षित हुन्छ?",
        en: "Ask how a tenant recovers a deposit when the agreement is silent on its return.",
      },
      citation: LEASE,
    });
  }

  if (f.noticeDays === null) {
    out.push({
      id: "lease-notice-absent",
      severity: "missing",
      title: { ne: "सूचना अवधि तोकिएको छैन", en: "No notice period stated" },
      detail: {
        ne: "बहाल अन्त्य गर्न कति दिनअगावै सूचना दिनुपर्ने भन्ने खुलेको छैन।",
        en: "The document does not say how much notice either side must give to end the tenancy.",
      },
      ask: {
        ne: "सूचना अवधि नखुलेमा कानुनबमोजिम कति दिन लाग्दछ?",
        en: "Ask what notice period applies by default when the agreement is silent.",
      },
      citation: LEASE,
    });
  }

  if (!f.statesRentIncrease) {
    out.push({
      id: "lease-rent-increase",
      severity: "check",
      title: { ne: "बहाल वृद्धिको व्यवस्था छैन", en: "Nothing governs rent increases" },
      detail: {
        ne: "बहाल कति र कहिले बढाउन सकिने भन्ने कागजातमा खुलेको छैन।",
        en: "The document does not govern when or by how much the rent may rise.",
      },
      ask: {
        ne: "अवधिभित्र बहाल बढाउन पाइन्छ कि पाइँदैन?",
        en: "Ask whether rent can be raised during the term when the agreement is silent.",
      },
      citation: LEASE,
    });
  }

  return out;
}

/* ------------------------------------------------------------------ loan */

function loanFindings(f: NonNullable<ContractFacts["loan"]>): Finding[] {
  const out: Finding[] = [];

  if (f.annualInterestPercent === null) {
    out.push({
      id: "loan-interest-absent",
      severity: "missing",
      title: { ne: "ब्याजदर उल्लेख छैन", en: "No interest rate stated" },
      detail: {
        ne: "सापटीमा ब्याज लाग्ने हो कि होइन र लागे कति दरले भन्ने खुलेको छैन।",
        en: "The document does not say whether interest is payable, or at what rate.",
      },
      ask: {
        ne: "ब्याजदर नखुलेको ऋण सम्झौतामा ब्याज दाबी गर्न सकिन्छ?",
        en: "Ask whether interest can be claimed at all when the agreement does not state a rate.",
      },
      citation: LOAN,
    });
  }

  if (!f.statesDefaultConsequence) {
    out.push({
      id: "loan-default-absent",
      severity: "missing",
      title: { ne: "भुक्तानी नगरेमा के हुने खुलेको छैन", en: "No consequence stated for default" },
      detail: {
        ne: "ऋणीले तोकिएको समयमा नबुझाएमा के हुने भन्ने कागजातमा छैन।",
        en: "The document is silent on what happens if the borrower does not repay on time.",
      },
      ask: {
        ne: "भुक्तानी नभएमा असुली कसरी गर्न सकिन्छ?",
        en: "Ask what recovery route exists when the agreement is silent on default.",
      },
      citation: LOAN,
    });
  }

  if (!f.hasSecurity && f.principalNpr !== null && f.principalNpr >= 500_000) {
    out.push({
      id: "loan-unsecured-large",
      severity: "check",
      title: { ne: "ठूलो रकम धितोबिना", en: "A substantial sum lent without security" },
      detail: {
        ne: `${formatNpr(f.principalNpr, "ne")} सापटी दिइएको छ तर कुनै धितो राखिएको छैन।`,
        en: `${formatNpr(f.principalNpr)} is lent with no collateral recorded.`,
      },
      ask: {
        ne: "यस रकमका लागि कस्तो धितो वा जमानत उपयुक्त हुन्छ?",
        en: "Ask what security or guarantee would be appropriate for a sum of this size.",
      },
      citation: LOAN,
    });
  }

  return out;
}

/* ------------------------------------------------------------------ generic */

const REQUIRED_CLAUSES: { key: ClauseKey; severity: Severity; title: Bilingual; ask: Bilingual }[] = [
  {
    key: "governing_law",
    severity: "missing",
    title: { ne: "प्रचलित कानुनको व्यवस्था छैन", en: "No governing law clause" },
    ask: {
      ne: "कुन देशको कानुन लागू हुने भन्ने नखुलेमा विवादमा के हुन्छ?",
      en: "Ask which law applies in a dispute when the document does not say.",
    },
  },
  {
    key: "dispute_resolution",
    severity: "missing",
    title: { ne: "विवाद समाधानको व्यवस्था छैन", en: "No dispute resolution clause" },
    ask: {
      ne: "विवाद परेमा कहाँ जाने भन्ने तय नभएको अवस्थामा के गर्नुपर्दछ?",
      en: "Ask where a dispute would have to be taken when no forum is agreed.",
    },
  },
  {
    key: "termination",
    severity: "missing",
    title: { ne: "अन्त्यको व्यवस्था छैन", en: "No termination clause" },
    ask: {
      ne: "सम्झौता कसरी अन्त्य गर्न सकिन्छ?",
      en: "Ask how either side may bring the agreement to an end.",
    },
  },
  {
    key: "signature_block",
    severity: "missing",
    title: { ne: "हस्ताक्षर स्थान छैन", en: "No signature block" },
    ask: {
      ne: "हस्ताक्षरबिनाको कागजात कार्यान्वयन हुन्छ?",
      en: "Ask whether the document can take effect without signature blocks.",
    },
  },
  {
    key: "witness_block",
    severity: "check",
    title: { ne: "साक्षीको स्थान छैन", en: "No witness block" },
    ask: {
      ne: "यस प्रकारको कागजातमा साक्षी अनिवार्य हो?",
      en: "Ask whether witnesses are required for a document of this kind.",
    },
  },
  {
    key: "date",
    severity: "check",
    title: { ne: "मिति छैन", en: "No date" },
    ask: {
      ne: "मिति नखुलेको कागजात कहिलेदेखि लागू भएको मानिन्छ?",
      en: "Ask from when an undated document is treated as taking effect.",
    },
  },
];

/** Anything suggesting the document is governed by law other than Nepal's. */
const FOREIGN_LAW = /\b(india|indian|singapore|england|english law|uk|united kingdom|usa|united states|delaware|new york|california|hong kong|dubai|uae)\b/i;

export function evaluate(facts: ContractFacts): Finding[] {
  const findings: Finding[] = [];

  if (facts.employment) findings.push(...employmentFindings(facts.employment));
  if (facts.lease) findings.push(...leaseFindings(facts.lease));
  if (facts.loan) findings.push(...loanFindings(facts.loan));

  const present = new Set<ClauseKey>(facts.clausesPresent);
  for (const req of REQUIRED_CLAUSES) {
    if (present.has(req.key)) continue;
    findings.push({
      id: `clause-${req.key}`,
      severity: req.severity,
      title: req.title,
      detail: {
        ne: "यो व्यवस्था कागजातमा भेटिएन।",
        en: "This provision was not found in the document.",
      },
      ask: req.ask,
      citation: CONTRACT,
    });
  }

  /*
   * A Nepali contract naming foreign law is worth a hard look. It is not
   * automatically improper — cross-border commercial agreements do it routinely —
   * so this is raised as a question rather than a fault.
   */
  if (facts.governingLawStated && FOREIGN_LAW.test(facts.governingLawStated)) {
    findings.push({
      id: "foreign-governing-law",
      severity: "check",
      title: { ne: "विदेशी कानुन लागू गरिएको", en: "A foreign governing law is named" },
      detail: {
        ne: `कागजातले "${facts.governingLawStated}" लागू हुने उल्लेख गरेको छ।`,
        en: `The document names "${facts.governingLawStated}" as the governing law.`,
      },
      ask: {
        ne: "नेपालमा कार्यान्वयन गर्नुपर्दा विदेशी कानुन छनौट गर्नुको के असर पर्दछ?",
        en: "Ask what naming a foreign law means if the agreement has to be enforced in Nepal.",
      },
      citation: CONTRACT,
    });
  }

  // Breaches first — they are arithmetic against a constant and the most certain.
  const rank: Record<Severity, number> = { breach: 0, missing: 1, check: 2 };
  return findings.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

export function summarise(findings: Finding[]) {
  return {
    breach: findings.filter((f) => f.severity === "breach").length,
    missing: findings.filter((f) => f.severity === "missing").length,
    check: findings.filter((f) => f.severity === "check").length,
  };
}
