import type { Bilingual, Field, Step } from "../types";
import { COURT_LEVELS, PETITION_COURT_FEE_NPR, ACTS, cite } from "../nepal";

/**
 * Shared scaffolding for the 52 Supreme Court petition templates.
 *
 * Every one of these petitions is filed inside an ALREADY-OPEN case, addressed to a
 * court, naming a petitioner and an opposing party in the same dense format the
 * government's own forms use. That structure — not any clause wording — is what
 * actually repeats 52 times, so it lives here exactly once.
 *
 * This is deliberately a separate file from common.ts. The helpers there
 * (partyStep, nameField, addressField) serve bilateral private instruments where two
 * parties agree to something; these serve a one-sided request to a court, in a
 * format the court itself prescribes down to the punctuation. Conflating the two
 * would either bloat the private-instrument helpers with litigation-only fields or
 * quietly drop detail these forms require — the guardian's name, the ward number,
 * the applicant's age — none of which an NDA or lease has any reason to ask for.
 */

/** Which court a petition is addressed to. Free courtName covers the specific bench. */
export function courtFields(): Field[] {
  return [
    {
      id: "courtLevel",
      type: "select",
      required: true,
      label: { ne: "अदालत", en: "Court" },
      options: COURT_LEVELS.map((c) => ({ value: c.value, label: c.label })),
    },
    {
      id: "courtName",
      type: "text",
      required: false,
      label: { ne: "अदालतको ठ्याक्कै नाम (वैकल्पिक)", en: "Exact court name (optional)" },
      help: {
        ne: "जस्तै: उच्च अदालत पाटन, जिल्ला अदालत काठमाडौं। खाली छोडे अदालतको तहमात्र देखिन्छ।",
        en: "E.g. \"High Court Patan\", \"District Court Kathmandu\". Left blank, only the court level shows.",
      },
      placeholder: { ne: "जिल्ला अदालत काठमाडौं", en: "District Court Kathmandu" },
    },
  ];
}

/**
 * One litigant's identifying detail, in the format these forms print it in: name,
 * guardian relation, guardian's name, district, municipality, ward, age, occupation.
 * More detailed than the `partyStep` helper in common.ts because a court petition
 * must identify a person well enough to be served or examined, not merely named.
 */
export function litigantFields(prefix: string, role: Bilingual): Field[] {
  return [
    {
      id: `${prefix}Name`,
      type: "text",
      required: true,
      label: { ne: `${role.ne}को नाम, थर`, en: `${role.en} — full name` },
    },
    {
      id: `${prefix}GuardianRelation`,
      type: "select",
      required: false,
      label: { ne: "नाता", en: "Relation to guardian" },
      help: {
        ne: "आमाबाबु वा पति/पत्नीको हकमा। संस्था वा सरकारी निकायको हकमा खाली छोड्नुहोस्।",
        en: "For a parent or spouse. Leave blank for an institution or government office.",
      },
      options: [
        { value: "chora", label: { ne: "को छोरा", en: "son of" } },
        { value: "chori", label: { ne: "की छोरी", en: "daughter of" } },
        { value: "pati", label: { ne: "की पति", en: "husband of" } },
        { value: "patni", label: { ne: "को पत्नी", en: "wife of" } },
      ],
    },
    {
      id: `${prefix}GuardianName`,
      type: "text",
      required: false,
      label: { ne: "बाबु/आमा/पति/पत्नीको नाम", en: "Guardian's or spouse's name" },
    },
    {
      id: `${prefix}District`,
      type: "text",
      required: true,
      label: { ne: "जिल्ला", en: "District" },
    },
    {
      id: `${prefix}Municipality`,
      type: "text",
      required: true,
      label: { ne: "नगरपालिका/गाउँपालिका", en: "Municipality / rural municipality" },
    },
    {
      id: `${prefix}Ward`,
      type: "text",
      required: true,
      label: { ne: "वडा नं.", en: "Ward no." },
    },
    {
      id: `${prefix}Age`,
      type: "number",
      required: false,
      label: { ne: "उमेर (वर्ष)", en: "Age (years)" },
    },
    {
      id: `${prefix}Occupation`,
      type: "text",
      required: false,
      label: { ne: "पेशा", en: "Occupation" },
    },
  ];
}

/** The party block interpolated inline, matching the run-on style the forms use. */
export function litigantLine(prefix: string): Bilingual {
  return {
    ne:
      `{{${prefix}Name}}, {{${prefix}GuardianRelation}} {{${prefix}GuardianName}}, ` +
      `जिल्ला {{${prefix}District}}, {{${prefix}Municipality}} वडा नं. {{${prefix}Ward}} बस्ने, ` +
      `वर्ष {{${prefix}Age}} को {{${prefix}Occupation}}`,
    en:
      `{{${prefix}Name}}, {{${prefix}GuardianRelation}} {{${prefix}GuardianName}}, ` +
      `of {{${prefix}Municipality}}, Ward No. {{${prefix}Ward}}, {{${prefix}District}} district, ` +
      `age {{${prefix}Age}}, occupation {{${prefix}Occupation}}`,
  };
}

/** The case a petition is filed inside. Every one of the 52 forms opens with this. */
export function caseReferenceFields(): Field[] {
  return [
    {
      id: "caseRegNo",
      type: "text",
      required: false,
      label: { ne: "मुद्दा/रिट दर्ता नं.", en: "Case/writ registration no." },
    },
    {
      id: "caseNo",
      type: "text",
      required: false,
      label: { ne: "मुद्दा/रिट नं.", en: "Case/writ no." },
    },
    {
      id: "caseName",
      type: "text",
      required: true,
      label: { ne: "मुद्दा", en: "Case (subject matter)" },
      help: {
        ne: "मुद्दाको किसिम, जस्तै: अंश, कर्जा, लिखत बदर।",
        en: "The nature of the case, e.g. partition, loan recovery, cancellation of deed.",
      },
    },
  ];
}

export function caseReferenceStep(): Step {
  return {
    id: "case",
    title: { ne: "अदालत र मुद्दाको विवरण", en: "The court and the case" },
    intro: {
      ne: "यो निवेदन पहिले नै दायर भएको मुद्दाभित्र पेस हुन्छ। मुद्दाको दर्ता नम्बर वा नम्बर थाहा नभए खाली छोड्न सकिन्छ, तर मुद्दाको किसिम अनिवार्य हो।",
      en: "This petition is filed inside a case that already exists. The registration or case number can be left blank if not known, but the nature of the case is required.",
    },
    fields: [...courtFields(), ...caseReferenceFields()],
  };
}

export function partiesStep(): Step {
  return {
    id: "parties",
    title: { ne: "पक्षहरू", en: "The parties" },
    fields: [
      ...litigantFields("petitioner", { ne: "निवेदक", en: "Petitioner" }),
      ...litigantFields("opponent", { ne: "विपक्षी", en: "Opposing party" }),
    ],
  };
}

/**
 * The signature/date field every petition closes with. A single BS date, rendered
 * long-form — the government form's separate "साल/महिना/गते" blanks collapse to one
 * field, matching how bsDateField is already used across the rest of the catalogue.
 */
export function signatureDateField(): Field {
  return {
    id: "signatureDateBs",
    type: "date-bs",
    required: true,
    label: { ne: "निवेदन गरेको मिति (वि.सं.)", en: "Date of the petition (BS)" },
    placeholder: { ne: "२०८३-०५-१५", en: "2083-05-15" },
  };
}

/**
 * The heading clause every petition opens with: which court, and the petition's own
 * title as the government form states it — locked, because this is the form's name
 * of record, not something a drafting choice should be free to reword.
 */
export function petitionHeadingClause(subject: Bilingual, isCopyPetition = false) {
  return {
    id: "heading",
    heading: { ne: "निवेदनको शीर्ष", en: "To the court" },
    locked: true,
    body: {
      ne: `{{courtLevel}}${isCopyPetition ? "मा चढाएको नक्कलको निवेदन पत्र" : "मा पेस गरेको निवेदन पत्र"}\n{{courtName}}\n\nविषय: ${subject.ne}।\n\nमुद्दा/रिट दर्ता नं. — {{caseRegNo}}\nमुद्दा/रिट नं. — {{caseNo}}`,
      en: `Petition presented to the ${isCopyPetition ? "" : ""}{{courtLevel}}\n{{courtName}}\n\nSubject: ${subject.en}.\n\nCase/writ registration no. — {{caseRegNo}}\nCase/writ no. — {{caseNo}}`,
    },
  };
}

export function partiesClause() {
  return {
    id: "parties",
    heading: { ne: "पक्षहरू", en: "The parties" },
    body: {
      ne: `${litigantLine("petitioner").ne} — निवेदक।\n\nविरुद्ध\n\n${litigantLine("opponent").ne} — विपक्षी।\n\nमुद्दा — {{caseName}}।`,
      en: `${litigantLine("petitioner").en} — petitioner.\n\nagainst\n\n${litigantLine("opponent").en} — opposing party.\n\nCase — {{caseName}}.`,
    },
  };
}

/**
 * The fixed filing-fee line nearly every one of the 52 forms states on its face —
 * NPR 10, set by the court's own fee schedule rather than anything this platform
 * charges. Shown so a client is not surprised that a receipt exists for ten rupees.
 */
export function courtFeeClause() {
  return {
    id: "fee",
    heading: { ne: "अदालती दस्तुर", en: "Court fee" },
    locked: true,
    body: {
      ne: `निवेदनबापत लाग्ने दस्तुर रु. ${PETITION_COURT_FEE_NPR}।– साथै राखी निम्नानुसार निवेदन गर्दछु/गर्दछौं:–`,
      en: `Filing this petition with the prescribed fee of NPR ${PETITION_COURT_FEE_NPR}, I/we petition as follows:–`,
    },
  };
}

/**
 * The closing declaration and signature block. Two wordings exist on the source
 * forms — the ordinary one, and the copy-petition variant ("ठिक छ... झूठा ठहरे"
 * rather than "ठिक साँचो हो... फरक ठहरे") — and which applies is a fact about the
 * specific form, not a drafting choice, so it is a parameter rather than a default.
 */
export function closingClause(variant: "standard" | "copy-petition" = "standard") {
  const body =
    variant === "copy-petition"
      ? {
          ne: "यसमा लेखिएको बेहोरा ठिक छ, झूठा ठहरे कानूनबमोजिम सहुँला बुझाउँला।\n\nनिवेदक: {{petitionerName}}\n\nइति संवत् {{signatureDateBs}} शुभम्।",
          en: "What is written herein is correct; if found false, I shall submit to the consequences prescribed by law.\n\nPetitioner: {{petitionerName}}\n\nDated (BS): {{signatureDateBs}}.",
        }
      : {
          ne: "लेखिएको बेहोरा ठिक साँचो हो, फरक ठहरे कानूनबमोजिम सहुँला बुझाउँला।\n\nनिवेदक: {{petitionerName}}\n\nइति संवत् {{signatureDateBs}} शुभम्।",
          en: "What is written herein is true and correct; if found otherwise, I shall submit to the consequences prescribed by law.\n\nPetitioner: {{petitionerName}}\n\nDated (BS): {{signatureDateBs}}.",
        };

  return {
    id: "closing",
    // Paragraph 2 on the forms: the truth declaration, then the signature and date.
    numbered: true,
    heading: { ne: "घोषणा र हस्ताक्षर", en: "Declaration and signature" },
    locked: true,
    body,
  };
}

/** What using one of these templates does and does not accomplish. */
export const LITIGATION_EXECUTION: Bilingual[] = [
  {
    ne: "यो कागजात एउटा निवेदन मात्र हो। अदालतले निवेदन स्वीकार गर्छ वा अस्वीकार गर्छ भन्ने कुरा अदालतकै अधिकार क्षेत्रमा रहन्छ।",
    en: "This document is only a petition. Whether the court grants it remains entirely the court's own decision.",
  },
  {
    ne: "सम्बन्धित मुद्दा दर्ता भएकै अदालतको फाँटमा, तोकिएको दस्तुर साथ, म्याद नाघ्नुअघि नै दर्ता गर्नुपर्नेछ।",
    en: "It must be filed at the registry of the court where the case itself is pending, with the prescribed fee, before any relevant deadline lapses.",
  },
  {
    ne: "यो निवेदनको ठ्याक्कै वैधानिक आधार पहिचान गर्न र दायर गर्दा हुने प्रक्रियागत जोखिम बुझ्न अधिवक्तासँग परामर्श गर्नुहोस् — विशेषतः दफा वा नियम छनोट गर्नुपर्ने अवस्थामा।",
    en: "Consult an advocate to confirm the exact statutory ground and to understand the procedural risk of filing — especially where the form requires choosing among alternative sections or rules.",
  },
];

/** Re-exported so template files need import only from here, not also from nepal.ts. */
export { ACTS, cite };
