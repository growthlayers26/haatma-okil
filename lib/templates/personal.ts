import type { Template } from "../types";
import { AGENCY, SUCCESSION, CONTRACT } from "../nepal";
import {
  pendingReview,
  nameField,
  citizenshipField,
  addressField,
  bsDateField,
  governingLawClause,
  EXECUTION,
} from "./common";

/* ------------------------------------------------------------------ power of attorney */

/**
 * Power of attorney (अख्तियारनामा).
 *
 * The most commonly needed personal instrument in Nepal, largely because so many
 * families have a member working abroad who needs someone at home to act on property,
 * banking or court matters.
 */
export const powerOfAttorney: Template = {
  slug: "power-of-attorney",
  category: "family",
  priceNpr: 499,
  title: { ne: "अख्तियारनामा", en: "Power of Attorney" },
  summary: {
    ne: "अर्को व्यक्तिलाई आफ्नो तर्फबाट काम गर्ने अधिकार दिने कागजात। विदेशमा रहेका नेपालीका लागि सबैभन्दा आवश्यक कागजात।",
    en: "Authorises another person to act on your behalf. The document most often needed by Nepalis working abroad.",
  },
  governingAct: AGENCY,
  review: pendingReview(),
  execution: [
    {
      ne: "अख्तियारनामा दिने व्यक्तिले दुई जना साक्षीसमक्ष हस्ताक्षर गर्नुपर्नेछ।",
      en: "The person granting the authority must sign before two witnesses.",
    },
    EXECUTION.notarised,
    {
      ne: "घरजग्गा किनबेच वा हक हस्तान्तरणका लागि अख्तियारनामा सम्बन्धित मालपोत कार्यालयमा दर्ता भएको हुनुपर्नेछ। नोटरी मात्र पर्याप्त हुँदैन।",
      en: "For sale or transfer of land, the power of attorney must be registered at the relevant Land Revenue Office. Notarisation alone is not sufficient.",
    },
    {
      ne: "विदेशबाट दिइने अख्तियारनामा सम्बन्धित नेपाली दूतावासबाट प्रमाणीकरण गराउनुपर्नेछ।",
      en: "A power of attorney granted from abroad must be attested by the Nepali embassy or consulate with jurisdiction.",
    },
  ],
  steps: [
    {
      id: "parties",
      title: { ne: "पक्षहरू", en: "The parties" },
      fields: [
        nameField("grantorName", { ne: "अख्तियार दिने व्यक्तिको नाम", en: "Name of the grantor" }),
        citizenshipField("grantorCitizenshipNo", {
          ne: "अख्तियार दिनेको नागरिकता नं.",
          en: "Grantor citizenship no.",
        }),
        addressField("grantorAddress", { ne: "अख्तियार दिनेको ठेगाना", en: "Grantor address" }),
        nameField("agentName", { ne: "अख्तियार पाउने व्यक्तिको नाम", en: "Name of the attorney" }),
        citizenshipField("agentCitizenshipNo", {
          ne: "अख्तियार पाउनेको नागरिकता नं.",
          en: "Attorney citizenship no.",
        }),
        addressField("agentAddress", { ne: "अख्तियार पाउनेको ठेगाना", en: "Attorney address" }),
        {
          id: "relationship",
          type: "text",
          label: { ne: "नाता", en: "Relationship" },
          placeholder: { ne: "जस्तै: छोरा, श्रीमती, भाइ", en: "e.g. son, spouse, brother" },
        },
      ],
    },
    {
      id: "scope",
      title: { ne: "अधिकारको दायरा", en: "Scope of authority" },
      intro: {
        ne: "अधिकार जति साँघुरो हुन्छ, दुरुपयोगको जोखिम त्यति नै कम हुन्छ।",
        en: "The narrower the authority, the smaller the risk of misuse. Grant only what is actually needed.",
      },
      fields: [
        {
          id: "scopeType",
          type: "select",
          required: true,
          label: { ne: "अख्तियारनामाको प्रकार", en: "Type of authority" },
          citation: AGENCY,
          help: {
            ne: "सामान्य अख्तियारनामाले व्यापक अधिकार दिन्छ। विशेष अख्तियारनामा एउटा निश्चित कामका लागि मात्र हुन्छ र सुरक्षित मानिन्छ।",
            en: "A general power grants broad authority. A special power is limited to one defined task and is materially safer.",
          },
          options: [
            { value: "special", label: { ne: "विशेष — एउटा निश्चित कामका लागि", en: "Special — one defined task" } },
            { value: "general", label: { ne: "सामान्य — व्यापक अधिकार", en: "General — broad authority" } },
          ],
        },
        {
          id: "authorisedActs",
          type: "textarea",
          required: true,
          label: { ne: "गर्न दिइएको काम", en: "Acts the attorney may perform" },
          placeholder: {
            ne: "जस्तै: कि.नं. ००० को जग्गा बिक्री गर्ने र मालपोत कार्यालयमा राजीनामा गरिदिने",
            en: "e.g. to sell land parcel no. 000 and execute the transfer at the Land Revenue Office",
          },
        },
        bsDateField("startDateBs", { ne: "प्रारम्भ मिति (वि.सं.)", en: "Effective from (BS)" }),
        bsDateField("expiryDateBs", { ne: "समाप्ति मिति (वि.सं.)", en: "Expires on (BS)" }, false),
      ],
    },
  ],
  clauses: [
    {
      id: "preamble",
      heading: { ne: "अख्तियारनामाको प्रारम्भ", en: "Preamble" },
      locked: true,
      citation: AGENCY,
      body: {
        // लाई marks the attorney's NAME, so it attaches there rather than trailing
        // the address clause that follows.
        ne: `म {{grantorName}} (नागरिकता प्रमाणपत्र नं. {{grantorCitizenshipNo}}), ठेगाना {{grantorAddress}}, स्वस्थ चित्त र स्वतन्त्र इच्छाले {{agentName}}लाई (नागरिकता प्रमाणपत्र नं. {{agentCitizenshipNo}}, ठेगाना {{agentAddress}}) देहायबमोजिम अख्तियार दिएको छु।`,
        en: `I, {{grantorName}} (citizenship certificate no. {{grantorCitizenshipNo}}), of {{grantorAddress}}, being of sound mind and acting of my own free will, hereby appoint {{agentName}} (citizenship certificate no. {{agentCitizenshipNo}}), of {{agentAddress}}, as my lawful attorney on the terms below.`,
      },
    },
    {
      id: "relationship",
      heading: { ne: "नाता", en: "Relationship" },
      when: { field: "relationship", op: "truthy" },
      body: {
        ne: `अख्तियार पाउने व्यक्ति मेरो {{relationship}} हुनुहुन्छ।`,
        en: `The attorney is my {{relationship}}.`,
      },
    },
    {
      id: "authority",
      heading: { ne: "दिइएको अधिकार", en: "Authority granted" },
      citation: AGENCY,
      body: {
        ne: `अख्तियार पाउने व्यक्तिले मेरो तर्फबाट देहायको काम गर्न पाउनेछन्: {{authorisedActs}}। यसबाहेकको कुनै पनि काम गर्ने अधिकार यस अख्तियारनामाले दिएको छैन।`,
        en: `The attorney may do the following on my behalf: {{authorisedActs}}. No authority beyond this is granted by this instrument.`,
      },
    },
    {
      id: "special-limit",
      heading: { ne: "अधिकारको सीमा", en: "Limits on the authority" },
      when: { field: "scopeType", op: "eq", value: "special" },
      locked: true,
      body: {
        ne: `यो विशेष अख्तियारनामा हो। माथि तोकिएको काम बाहेक अन्य कुनै विषयमा अख्तियार पाउने व्यक्तिले मेरो तर्फबाट काम गर्न पाउने छैनन्।`,
        en: `This is a special power of attorney. The attorney has no authority to act for me in any matter other than the one specified above.`,
      },
    },
    {
      id: "duration",
      heading: { ne: "अवधि", en: "Duration" },
      body: {
        ne: `यो अख्तियारनामा {{startDateBs}} देखि लागू हुनेछ र {{expiryDateBs}} सम्म कायम रहनेछ, वा सोभन्दा अगावै मैले लिखित रूपमा खारेज गरेमा खारेज हुनेछ।`,
        en: `This power takes effect on {{startDateBs}} and remains in force until {{expiryDateBs}}, unless I revoke it in writing before then.`,
      },
    },
    {
      id: "revocation",
      heading: { ne: "खारेजी", en: "Revocation" },
      locked: true,
      citation: AGENCY,
      body: {
        ne: `मैले जुनसुकै समयमा लिखित सूचना दिई यो अख्तियारनामा खारेज गर्न सक्नेछु। खारेज गरेको जानकारी सम्बन्धित कार्यालय तथा तेस्रो पक्षलाई दिनु मेरो दायित्व हुनेछ। मेरो मृत्यु भएमा यो अख्तियारनामा स्वतः निष्क्रिय हुनेछ।`,
        en: `I may revoke this power at any time by written notice, and it is my responsibility to inform the relevant offices and any third parties of the revocation. This power lapses automatically on my death.`,
      },
    },
    {
      id: "ratification",
      heading: { ne: "स्वीकृति", en: "Ratification" },
      locked: true,
      body: {
        ne: `अख्तियार पाउने व्यक्तिले यस अख्तियारनामाको सीमाभित्र रही गरेको काम मैले नै गरेसरह मान्य हुनेछ।`,
        en: `Anything lawfully done by the attorney within the scope of this power shall be as valid as if done by me.`,
      },
    },
    governingLawClause(AGENCY),
  ],
};

/* ------------------------------------------------------------------ will */

/**
 * Will (इच्छापत्र).
 *
 * Nepali succession is not free disposition. Coparcenary partition rights mean a
 * testator generally cannot will away ancestral property that heirs have a share in,
 * and a will that ignores this is the kind that gets set aside. The template says so
 * on its face rather than letting someone discover it posthumously.
 */
export const will: Template = {
  slug: "will",
  category: "family",
  priceNpr: 699,
  title: { ne: "इच्छापत्र", en: "Will" },
  summary: {
    ne: "आफ्नो सम्पत्ति कसलाई दिने भन्ने इच्छा लेखिने कागजात। अंश हकसम्बन्धी कानुनी सीमा समेत स्पष्ट पारिएको।",
    en: "Records who is to receive your property. Written to make the statutory limits on disposal explicit rather than leaving them to be discovered later.",
  },
  governingAct: SUCCESSION,
  review: pendingReview(),
  execution: [
    {
      ne: "इच्छापत्र लेख्ने व्यक्तिले दुई जना साक्षीसमक्ष हस्ताक्षर गर्नुपर्नेछ। साक्षी इच्छापत्रबाट लाभ पाउने व्यक्ति हुनुहुँदैन।",
      en: "The testator must sign before two witnesses. A witness must not be a beneficiary under the will.",
    },
    EXECUTION.notarised,
    {
      ne: "इच्छापत्र सम्बन्धित वडा कार्यालय वा मालपोत कार्यालयमा दर्ता गराउँदा पछि विवाद हुने सम्भावना घट्दछ।",
      en: "Registering the will with the ward office or Land Revenue Office materially reduces the risk of a later challenge.",
    },
    {
      ne: "अंशियारको हक हनन हुने गरी लेखिएको इच्छापत्र अदालतबाट बदर हुन सक्दछ — अधिवक्तासँग परामर्श गर्नुहोस्।",
      en: "A will that defeats a coparcener's partition right can be set aside by a court. Take advice from an advocate before relying on this.",
    },
  ],
  steps: [
    {
      id: "testator",
      title: { ne: "इच्छापत्र लेख्ने व्यक्ति", en: "The testator" },
      fields: [
        nameField("testatorName", { ne: "पूरा नाम", en: "Full name" }),
        citizenshipField("testatorCitizenshipNo", { ne: "नागरिकता नं.", en: "Citizenship no." }),
        addressField("testatorAddress", { ne: "स्थायी ठेगाना", en: "Permanent address" }),
        nameField("fatherName", { ne: "बुबाको नाम", en: "Father's name" }, false),
        bsDateField("dateBs", { ne: "इच्छापत्र लेखिएको मिति (वि.सं.)", en: "Date of the will (BS)" }),
      ],
    },
    {
      id: "property",
      title: { ne: "सम्पत्तिको विवरण", en: "The property" },
      intro: {
        ne: "अंश नलागेको आफ्नै आर्जनको सम्पत्ति मात्र स्वतन्त्र रूपमा इच्छापत्रबाट दिन सकिन्छ।",
        en: "Only self-acquired property free of partition claims can be freely disposed of by will.",
      },
      fields: [
        {
          id: "propertyType",
          type: "select",
          required: true,
          label: { ne: "सम्पत्तिको प्रकृति", en: "Nature of the property" },
          citation: SUCCESSION,
          help: {
            ne: "पैतृक सम्पत्तिमा अंशियारको हक हुन्छ र त्यसलाई इच्छापत्रबाट स्वतन्त्र रूपमा हस्तान्तरण गर्न मिल्दैन।",
            en: "Ancestral property carries coparcenary rights and generally cannot be disposed of freely by will.",
          },
          options: [
            { value: "self", label: { ne: "आफ्नै आर्जनको", en: "Self-acquired" } },
            { value: "ancestral", label: { ne: "पैतृक", en: "Ancestral" } },
            { value: "mixed", label: { ne: "दुवै मिश्रित", en: "Both" } },
          ],
        },
        {
          id: "propertyDetails",
          type: "textarea",
          required: true,
          label: { ne: "सम्पत्तिको विस्तृत विवरण", en: "Full description of the property" },
          placeholder: {
            ne: "जस्तै: कि.नं. ००० को जग्गा, वडा नं. ०; बैंक खाता नं. ०००",
            en: "e.g. land parcel no. 000, Ward No. 0; bank account no. 000",
          },
        },
        {
          id: "beneficiaries",
          type: "textarea",
          required: true,
          label: { ne: "कसलाई कति दिने", en: "Who receives what" },
          placeholder: {
            ne: "जस्तै: छोरी सीता श्रेष्ठलाई कि.नं. ००० को जग्गा",
            en: "e.g. to my daughter Sita Shrestha, land parcel no. 000",
          },
        },
        nameField("executorName", { ne: "कार्यान्वयन गर्ने व्यक्ति", en: "Executor" }, false),
      ],
    },
  ],
  clauses: [
    {
      id: "declaration",
      heading: { ne: "घोषणा", en: "Declaration" },
      locked: true,
      citation: SUCCESSION,
      body: {
        ne: `म {{testatorName}} (नागरिकता प्रमाणपत्र नं. {{testatorCitizenshipNo}}), ठेगाना {{testatorAddress}}, स्वस्थ चित्त, होस र स्वतन्त्र इच्छाले, कसैको करकाप वा प्रभावमा नपरी, {{dateBs}} मा यो इच्छापत्र लेखेको छु।`,
        en: `I, {{testatorName}} (citizenship certificate no. {{testatorCitizenshipNo}}), of {{testatorAddress}}, being of sound mind and acting freely and without coercion or undue influence, make this Will on {{dateBs}}.`,
      },
    },
    {
      id: "revoke-prior",
      heading: { ne: "अघिल्ला इच्छापत्रको खारेजी", en: "Revocation of earlier wills" },
      locked: true,
      body: {
        ne: `यसअघि मैले लेखेका सबै इच्छापत्र तथा सोसम्बन्धी कागजात यसै इच्छापत्रबाट खारेज गरेको छु।`,
        en: `I revoke all wills and testamentary documents previously made by me.`,
      },
    },
    {
      id: "property",
      heading: { ne: "सम्पत्तिको विवरण", en: "The property" },
      body: {
        ne: `यो इच्छापत्र देहायको सम्पत्तिसँग सम्बन्धित छ:\n\n{{propertyDetails}}`,
        en: `This Will concerns the following property:\n\n{{propertyDetails}}`,
      },
    },
    {
      id: "distribution",
      heading: { ne: "सम्पत्तिको बाँडफाँट", en: "Distribution" },
      citation: SUCCESSION,
      body: {
        ne: `मेरो मृत्युपछि माथि उल्लिखित सम्पत्ति देहायबमोजिम हस्तान्तरण होस् भन्ने मेरो इच्छा छ:\n\n{{beneficiaries}}`,
        en: `On my death it is my wish that the property described above pass as follows:\n\n{{beneficiaries}}`,
      },
    },
    {
      id: "coparcenary-warning",
      heading: { ne: "अंश हकसम्बन्धी सीमा", en: "Limits arising from partition rights" },
      locked: true,
      citation: SUCCESSION,
      when: { field: "propertyType", op: "neq", value: "self" },
      body: {
        ne: `यस इच्छापत्रमा उल्लिखित सम्पत्तिमा पैतृक अंश समावेश भएको हुनाले अंशियारहरूको हक प्रचलित कानुनबमोजिम सुरक्षित रहनेछ। अंशियारको हक हनन हुने हदसम्म यो इच्छापत्र कार्यान्वयन नहुन सक्दछ।`,
        en: `Because the property described includes an ancestral share, the partition rights of coparceners remain protected under prevailing law. To the extent this Will would defeat those rights, it may not be given effect.`,
      },
    },
    {
      id: "executor",
      heading: { ne: "कार्यान्वयन", en: "Execution of the will" },
      when: { field: "executorName", op: "truthy" },
      body: {
        // The postposition लाई attaches directly to the noun — no space before it.
        ne: `यस इच्छापत्रको कार्यान्वयन गर्ने जिम्मेवारी {{executorName}}लाई दिएको छु।`,
        en: `I appoint {{executorName}} to carry this Will into effect.`,
      },
    },
    {
      id: "witnesses",
      heading: { ne: "साक्षी", en: "Witnesses" },
      locked: true,
      body: {
        ne: `यो इच्छापत्र मैले दुई जना साक्षीको रोहबरमा हस्ताक्षर गरेको हुँ। साक्षीहरू यस इच्छापत्रबाट कुनै लाभ पाउने व्यक्ति होइनन्।`,
        en: `I have signed this Will in the presence of two witnesses, neither of whom takes any benefit under it.`,
      },
    },
    governingLawClause(CONTRACT),
  ],
};
