import type { Bilingual, Field, Step } from "../types";
import {
  courtFields,
  caseReferenceFields,
  litigantFields,
  litigantLine,
  signatureDateField,
} from "./litigation-common";
import { ACTS, cite } from "../nepal";

/**
 * Shared scaffolding for documents that a lawsuit itself is made of — the plaint that
 * opens a case, the written statement that answers it, the appeal that challenges a
 * judgment — as distinct from litigation-common.ts, which serves the 52 petitions
 * filed INSIDE a case that is already running.
 *
 * The difference is not cosmetic. A petition from litigation-common.ts references an
 * existing case number and pays a flat NPR 10 filing fee set by the court's own fee
 * schedule. A plaint has no case number yet — filing it is what creates one — and its
 * court fee is a percentage of the claim's value, not a flat amount; this file never
 * states a figure for it; every template built on it directs the client to the
 * court's own fee counter rather than guessing. Reusing litigation-common's
 * `caseReferenceStep`/`courtFeeClause` here would silently assert a case number that
 * does not exist yet and a fee that is not what this filing actually costs.
 *
 * `litigantFields`, `litigantLine`, `courtFields` and `signatureDateField` genuinely
 * are identical between the two — a person is identified in a filing the same way
 * whether the filing opens the case or answers it — so those are imported from
 * litigation-common.ts rather than duplicated.
 */

export { ACTS, cite };

/**
 * Nepal's civil courts hear a party named once and identified fully as "party one" —
 * a second, third or fourth co-party on the same side is named on their own line
 * below, each ending "१" the way the source documents number them, rather than
 * repeating the full guardian/district/ward block. Real अंशचलन filings regularly
 * name three to six co-heirs; asking for full structured detail on each would make a
 * five-minute filing into a thirty-field form for a fact pattern that varies by
 * family, not by legal significance.
 */
export function additionalPartiesField(id: string, label: Bilingual): Field {
  return {
    id,
    type: "textarea",
    required: false,
    label,
    help: {
      ne: "यदि थप पक्ष छन् भने हरेकलाई छुट्टै लाइनमा, फिराद–पत्रमा जस्तै पूरा विवरण सहित लेख्नुहोस्। एक जना मात्र भए खाली छोड्नुहोस्।",
      en: "If there are more parties on this side, list each on its own line with the same full detail the plaint itself uses. Leave blank if there is only one.",
    },
    placeholder: {
      ne: "उदाहरण: गोपी वस्नेत, खड्ग बहादुर वस्नेतको छोरा, जिल्ला रामेछाप ...",
      en: "Example: Gopi Basnet, son of Khadga Bahadur Basnet, Ramechhap district ...",
    },
  };
}

export function plaintiffStep(): Step {
  return {
    id: "plaintiff",
    title: { ne: "फिरादीको विवरण", en: "The plaintiff" },
    fields: [...litigantFields("plaintiff", { ne: "फिरादी", en: "Plaintiff" })],
  };
}

export function defendantsStep(): Step {
  return {
    id: "defendants",
    title: { ne: "विपक्षीहरूको विवरण", en: "The opposing parties" },
    fields: [
      ...litigantFields("defendant", { ne: "विपक्षी", en: "Opposing party" }),
      additionalPartiesField("otherDefendants", {
        ne: "थप विपक्षीहरू (भए मात्र)",
        en: "Other opposing parties (if any)",
      }),
    ],
  };
}

export function courtStep(intro: Bilingual): Step {
  return {
    id: "court",
    title: { ne: "अदालत", en: "Court" },
    intro,
    fields: [...courtFields()],
  };
}

/**
 * For a written statement or an appeal — filed, unlike a plaint, inside a case that
 * already exists and already has a number on it. `caseReferenceFields` is the same
 * three fields the 52 within-case petitions in litigation-common.ts ask for; reused
 * here rather than duplicated, since a case number is identified the same way
 * whichever kind of filing is naming it.
 */
export function courtAndCaseStep(intro: Bilingual): Step {
  return {
    id: "court",
    title: { ne: "अदालत र मुद्दाको विवरण", en: "The court and the case" },
    intro,
    fields: [...courtFields(), ...caseReferenceFields()],
  };
}

/** The heading for a filing that answers or appeals an existing case — carries the case reference, unlike pleadingHeadingClause. */
export function pleadingWithCaseHeadingClause(documentTitle: Bilingual, subject: Bilingual) {
  return {
    id: "heading",
    heading: { ne: "शीर्ष", en: "Heading" },
    locked: true,
    body: {
      ne: `{{courtLevel}}मा दायर गरेको\n${documentTitle.ne}\n\nविषय:– ${subject.ne}।\n\nमुद्दा/रिट दर्ता नं. — {{caseRegNo}}\nमुद्दा/रिट नं. — {{caseNo}}\nमुद्दा — {{caseName}}`,
      en: `${documentTitle.en} presented to the\n{{courtLevel}}\n\nSubject:– ${subject.en}.\n\nCase/writ registration no. — {{caseRegNo}}\nCase/writ no. — {{caseNo}}\nCase — {{caseName}}`,
    },
  };
}

/**
 * The heading a plaint or written statement opens with — a court and a subject, but
 * no case number, because filing this is what creates the case (or, for a written
 * statement, the case number is a fact the client copies off their own summons and
 * belongs in the narrative fields, not asserted here as though this firm already
 * has it on file).
 */
export function pleadingHeadingClause(documentTitle: Bilingual, subject: Bilingual) {
  return {
    id: "heading",
    heading: { ne: "शीर्ष", en: "Heading" },
    locked: true,
    body: {
      ne: `{{courtLevel}}मा चढाएको\n${documentTitle.ne}\n\nविषय:– ${subject.ne}।`,
      en: `${documentTitle.en} presented to the\n{{courtLevel}}\n\nSubject:– ${subject.en}.`,
    },
  };
}

/** The party block: plaintiff(s), "बिरुद्ध", defendant(s) — the format every one of the source filings uses. */
export function pleadingPartiesClause(plaintiffRole: Bilingual, defendantRole: Bilingual) {
  return {
    id: "parties",
    heading: { ne: "पक्षहरू", en: "The parties" },
    body: {
      ne: `${litigantLine("plaintiff").ne} — ${plaintiffRole.ne}।\n{{otherDefendants}}\n\nबिरुद्ध\n\n${litigantLine("defendant").ne} — ${defendantRole.ne}।\n{{otherDefendants}}`,
      en: `${litigantLine("plaintiff").en} — ${plaintiffRole.en}.\n\nagainst\n\n${litigantLine("defendant").en} — ${defendantRole.en}.\n{{otherDefendants}}`,
    },
  };
}

/**
 * The jurisdiction-and-standing paragraph nearly every plaint in the source
 * documents opens its numbered body with, citing the two provisions that actually do
 * that work: Administration of Justice Act §7 for which court may hear the matter,
 * and the former Muluki Ain's General Code §82 (still the citation practising
 * advocates use for standing to sue — the Civil Code, 2074 restates it but §82 is
 * what the filings themselves cite) for the plaintiff's own right to bring it.
 */
export function jurisdictionClause() {
  return {
    id: "jurisdiction",
    numbered: true,
    heading: { ne: "अधिकार क्षेत्र र हकदैया", en: "Jurisdiction and standing" },
    locked: true,
    citation: cite(ACTS.judicialAdministration, "दफा ७", "§7"),
    body: {
      ne: "माथि उल्लेखित विपक्षीहरूले मलाई/हामीलाई अन्याय गरेको व्यहोरा तलका प्रकरणहरूमा उल्लेख गरी न्याय प्रशासन ऐन, २०७३ को दफा ७ बमोजिम मुद्दा हेर्ने अधिकार क्षेत्र यसै अदालतलाई भएको र यस कुरामा नालिस गर्ने हक अधिकार मुलुकी ऐन, अ.व. ८२ नं. बमोजिम मलाई/हामीलाई हकदैया रहेकोले यो फिराद लिई सम्मानित अदालत समक्ष उपस्थित भएको छु/छौं।",
      en: "The opposing parties named above have wronged me/us, as set out in the paragraphs below. Jurisdiction over this matter rests with this Court under Administration of Justice Act, 2073 §7, and I/we have standing to bring it under the General Code §82 of the Muluki Ain, and so present this plaint before this honourable Court.",
    },
  };
}

/**
 * Every source filing closes with the same three elements: a schedule of witnesses
 * (देखिजान्ने / सुनिजान्ने — those who saw, those who heard) and documentary evidence
 * (कागज), the truth declaration, and the signature with a BS date. Free-text rather
 * than a repeating field group, for the same reason additionalPartiesField is —
 * the number and kind of evidence is a fact about the case, not the form.
 */
export function evidenceFields(): Field[] {
  return [
    {
      id: "witnesses",
      type: "textarea",
      required: false,
      label: { ne: "साक्षीहरू (देखी/सुनी जान्ने)", en: "Witnesses (who saw or heard)" },
      help: {
        ne: "हरेक साक्षीको नाम, ठेगाना, उमेर छुट्टै लाइनमा लेख्नुहोस्।",
        en: "One witness per line: name, address, age.",
      },
    },
    {
      id: "documentaryEvidence",
      type: "textarea",
      required: false,
      label: { ne: "पेस गरिने कागजातहरू", en: "Documents to be filed as evidence" },
      help: {
        ne: "जस्तै: नागरिकताको प्रतिलिपि, लिखतको प्रतिलिपि, जन्मदर्ता प्रमाणपत्र।",
        en: "E.g. copy of citizenship certificate, copy of the deed, birth registration certificate.",
      },
    },
  ];
}

export function evidenceClause() {
  return {
    id: "evidence",
    numbered: true,
    heading: { ne: "साक्षी र प्रमाण", en: "Witnesses and evidence" },
    body: {
      ne: "मेरा/हाम्रा तपसिलमा लेखिएका साक्षी प्रमाण बुझी न्याय इन्साफ गरी पाऊँ।\n\nतपसिल\nसाक्षीहरू — {{witnesses}}\nकागजात — {{documentaryEvidence}}",
      en: "I/we pray that the witnesses and evidence set out below be examined and justice done.\n\nSchedule\nWitnesses — {{witnesses}}\nDocuments — {{documentaryEvidence}}",
    },
  };
}

/** No advocate appointed yet — the standard line every source filing includes when true. */
export function noAdvocateClause() {
  return {
    id: "noAdvocate",
    numbered: true,
    heading: { ne: "कानुन व्यवसायी", en: "Legal counsel" },
    body: {
      ne: "हाल कानुन व्यवसायी मुकरर गरेको छैन। हाम्रो तर्फबाट रहनुहुने कानुन व्यवसायीको बहस पैरवी र प्रस्तुत हुने नजिर समेतलाई यसै मुद्दाको अभिन्न अंग मानी पाऊँ।",
      en: "No legal counsel has been retained as of this filing. I/we pray that the submissions and precedents of whichever counsel later appears on my/our behalf be treated as an integral part of this filing.",
    },
  };
}

/**
 * The declaration and signature a plaint or written statement closes with —
 * "फिरादी"/"वादी" for a plaint, not "निवेदक", the way litigation-common's
 * closingClause is worded for the 52 within-case petitions.
 */
export function pleadingClosingClause(signatoryRole: Bilingual, nameFieldId: string) {
  return {
    id: "closing",
    numbered: true,
    heading: { ne: "घोषणा र हस्ताक्षर", en: "Declaration and signature" },
    locked: true,
    body: {
      ne: `यसमा लेखिएको व्यहोरा ठिक साँचो हो, झुठ्ठा ठहरे कानुन बमोजिम सहुँला बुझाउँला।\n\n${signatoryRole.ne}: {{${nameFieldId}}}\n\nइति सम्वत् {{signatureDateBs}} शुभम्।`,
      en: `What is written herein is true and correct; if found otherwise, I shall submit to the consequences prescribed by law.\n\n${signatoryRole.en}: {{${nameFieldId}}}\n\nDated (BS): {{signatureDateBs}}.`,
    },
  };
}

export { signatureDateField };

/** What filing one of these documents does and does not accomplish. */
export const PLEADING_EXECUTION: Bilingual[] = [
  {
    ne: "यो कागजात मस्यौदा मात्र हो। अदालतको दर्ता फाँटमा नपुगेसम्म कुनै मुद्दा दायर हुँदैन।",
    en: "This document is only a draft. No case exists until it is actually filed at the court's own registry.",
  },
  {
    ne: "दाबीको रकम वा मूल्यअनुसार लाग्ने अदालती शुल्क अदालतले नै तोक्छ — यो फर्मले तोक्ने वा अनुमान गर्ने कुरा होइन। दर्ता गर्नुअघि अदालतको फाँटमै बुझ्नुहोस्।",
    en: "The court fee depends on the value of the claim and is set by the court's own fee schedule, not by this firm. Confirm the exact amount at the registry before filing.",
  },
  {
    ne: "यसमा उल्लेख गरिएका तथ्य कथनहरू पूर्ण रूपमा सही र प्रमाणित हुनैपर्छ — गलत वा नपुष्टि तथ्यले मुद्दा नै धरापमा पार्न सक्छ।",
    en: "Every factual statement in it must be complete and provable — an inaccurate or unsupported fact can jeopardise the case itself.",
  },
  {
    ne: "दायर गर्नुअघि अधिवक्तासँग परामर्श गरी दाबीको सही कानुनी आधार, हदम्याद र संलग्न गर्नुपर्ने कागजात पुष्टि गर्नुहोस्।",
    en: "Consult an advocate before filing to confirm the precise legal basis for the claim, the limitation period, and which documents must accompany it.",
  },
];
