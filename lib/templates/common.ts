import type { AdvocateReview, Field, Bilingual, Citation } from "../types";

/**
 * Shared building blocks for the template catalogue.
 *
 * Thirty templates of copy-pasted party blocks would drift apart within a month, and
 * drift in a legal template is a professional exposure rather than an inconsistency.
 * Anything identical across documents lives here exactly once.
 */

/**
 * Every template ships unreviewed until an advocate at the firm signs it off.
 *
 * The licence is null rather than a placeholder string. A fabricated credential
 * would be worse than an empty one, and a visible "PENDING" is worse than nothing —
 * it reads as a broken page rather than as work still to be done.
 */
export function pendingReview(reviewedOnBs = "2083-05-10", nextReviewBs = "2084-05-10"): AdvocateReview {
  return {
    name: { ne: "अधिवक्ता — नियुक्ति बाँकी", en: "Advocate — pending assignment" },
    nbcLicence: null,
    reviewedOnBs,
    nextReviewBs,
  };
}

/** Name field for a natural person or an entity. */
export function nameField(id: string, label: Bilingual, required = true): Field {
  return { id, type: "text", required, label };
}

/**
 * Citizenship certificate number. Collected on instruments where identifying the
 * party matters in a dispute — which is most of them.
 */
export function citizenshipField(id: string, label: Bilingual, required = true): Field {
  return {
    id,
    type: "text",
    required,
    label,
    help: {
      ne: "विवाद परेको खण्डमा पक्ष पहिचान गर्न आवश्यक।",
      en: "Needed to identify the party if the document is ever disputed.",
    },
  };
}

export function addressField(id: string, label: Bilingual, required = true): Field {
  return { id, type: "textarea", required, label };
}

export function bsDateField(id: string, label: Bilingual, required = true): Field {
  return {
    id,
    type: "date-bs",
    required,
    label,
    placeholder: { ne: "२०८३-०५-१५", en: "2083-05-15" },
  };
}

export function moneyField(id: string, label: Bilingual, help?: Bilingual, required = true): Field {
  return { id, type: "currency", required, label, help };
}

export function yesNoField(
  id: string,
  label: Bilingual,
  yes: Bilingual,
  no: Bilingual,
  help?: Bilingual,
): Field {
  return {
    id,
    type: "select",
    required: true,
    label,
    help,
    options: [
      { value: "yes", label: yes },
      { value: "no", label: no },
    ],
  };
}

/**
 * A pair of party blocks — the opening step on nearly every bilateral instrument.
 * `roleA`/`roleB` are the words the document itself uses for the parties.
 */
export function partyStep(
  a: { prefix: string; role: Bilingual },
  b: { prefix: string; role: Bilingual },
): Field[] {
  return [
    nameField(`${a.prefix}Name`, { ne: `${a.role.ne}को नाम`, en: `${a.role.en} name` }),
    citizenshipField(`${a.prefix}CitizenshipNo`, {
      ne: `${a.role.ne}को नागरिकता नं.`,
      en: `${a.role.en} citizenship no.`,
    }),
    addressField(`${a.prefix}Address`, { ne: `${a.role.ne}को ठेगाना`, en: `${a.role.en} address` }),
    nameField(`${b.prefix}Name`, { ne: `${b.role.ne}को नाम`, en: `${b.role.en} name` }),
    citizenshipField(`${b.prefix}CitizenshipNo`, {
      ne: `${b.role.ne}को नागरिकता नं.`,
      en: `${b.role.en} citizenship no.`,
    }),
    addressField(`${b.prefix}Address`, { ne: `${b.role.ne}को ठेगाना`, en: `${b.role.en} address` }),
  ];
}

/** Execution requirements that recur across instrument types. */
export const EXECUTION = {
  bothSign: {
    ne: "दुवै पक्षले प्रत्येक पृष्ठमा हस्ताक्षर गर्नुपर्नेछ र प्रत्येकले एक-एक प्रति राख्नुपर्नेछ।",
    en: "Both parties must sign every page, and each retains an original copy.",
  },
  twoWitnesses: {
    ne: "दुई जना साक्षीको हस्ताक्षर, नागरिकता नम्बर र सम्पर्क विवरण आवश्यक पर्दछ।",
    en: "Two witnesses must sign, giving their citizenship numbers and contact details.",
  },
  notarised: {
    ne: "यो कागजात नोटरी पब्लिकबाट प्रमाणीकरण गराउनुपर्नेछ।",
    en: "This document must be notarised by a notary public to be relied on.",
  },
  wardRegistration: {
    ne: "सम्बन्धित स्थानीय तह वा वडा कार्यालयमा दर्ता गर्नुपर्ने हुन सक्दछ।",
    en: "Registration at the relevant ward or local body may be required.",
  },
  landRevenueOffice: {
    ne: "घरजग्गा सम्बन्धी हक हस्तान्तरण मालपोत कार्यालयमा दर्ता नभई कानुनी रूपमा पूरा हुँदैन।",
    en: "A transfer of interest in land is not legally complete until registered at the Land Revenue Office.",
  },
  notExecutedByDownload: {
    ne: "यो कागजात डाउनलोड गर्दैमा सम्झौता सम्पन्न हुँदैन।",
    en: "Downloading this document does not by itself execute the agreement.",
  },
  stampDuty: {
    ne: "प्रचलित दरबमोजिम टिकट दस्तुर लाग्न सक्दछ। अधिवक्तासँग पुष्टि गर्नुहोस्।",
    en: "Stamp duty may apply at the prevailing rate. Confirm with an advocate.",
  },
} as const satisfies Record<string, Bilingual>;

/** The governing-law clause, which is identical on every Civil Code instrument. */
export function governingLawClause(citation: Citation) {
  return {
    id: "governing",
    heading: { ne: "प्रचलित कानुन", en: "Governing law" },
    locked: true,
    citation,
    body: {
      ne: "यो कागजात नेपालको मुलुकी देवानी संहिता, २०७४ द्वारा निर्देशित हुनेछ र नेपालका अधिकारप्राप्त अदालतको क्षेत्राधिकार रहनेछ। यसका कुनै सर्त प्रचलित कानुनसँग बाझिएमा सो हदसम्म कानुन नै लागू हुनेछ।",
      en: "This document is governed by the Muluki Civil Code, 2074 of Nepal and is subject to the jurisdiction of its competent courts. Where any term conflicts with prevailing law, the law prevails to the extent of the conflict.",
    },
  };
}
