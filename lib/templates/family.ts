import type { Template } from "../types";
import { DIVORCE, ADOPTION, AFFIDAVIT, FALSE_STATEMENT, CONTRACT } from "../nepal";
import {
  pendingReview,
  nameField,
  citizenshipField,
  addressField,
  bsDateField,
  moneyField,
  governingLawClause,
  EXECUTION,
} from "./common";

/* ------------------------------------------------------------------ divorce */

/**
 * Mutual-consent divorce petition.
 *
 * A petition is a request, not an outcome. The marriage ends when the court grants a
 * decree, and until then both parties remain married however complete this document
 * looks. People act on the signed paper — remarrying, disposing of property — and
 * that is the harm this template is written to prevent.
 */
export const divorcePetition: Template = {
  slug: "divorce-petition-mutual",
  category: "family",
  priceNpr: 1_299,
  title: { ne: "सहमतिमा सम्बन्ध विच्छेदको निवेदन", en: "Mutual Consent Divorce Petition" },
  summary: {
    ne: "दुवै पक्षको सहमतिमा सम्बन्ध विच्छेदका लागि अदालतमा दिइने निवेदनको ढाँचा। अदालतको फैसलाबिना सम्बन्ध विच्छेद हुँदैन।",
    en: "Petition to the court for divorce by mutual consent. The marriage does not end until the court grants a decree.",
  },
  governingAct: DIVORCE,
  review: pendingReview(),
  execution: [
    {
      ne: "यो निवेदनमा हस्ताक्षर गर्दैमा सम्बन्ध विच्छेद हुँदैन। अदालतबाट फैसला नभएसम्म विवाह कायमै रहन्छ।",
      en: "Signing this petition does not end the marriage. Until the court grants a decree the parties remain married.",
    },
    {
      ne: "सम्बन्धित जिल्ला अदालतमा दुवै पक्ष उपस्थित भई दर्ता गर्नुपर्नेछ।",
      en: "Both parties must attend the relevant District Court to file it.",
    },
    {
      ne: "नाबालक सन्तान वा सम्पत्ति सम्बन्धी विषय भएमा अधिवक्ताको सहयोग आवश्यक पर्दछ।",
      en: "Where there are minor children or property to divide, an advocate should be instructed — those terms are what get contested later.",
    },
    EXECUTION.bothSign,
  ],
  steps: [
    {
      id: "parties",
      title: { ne: "पक्षहरू", en: "The parties" },
      fields: [
        nameField("husbandName", { ne: "पतिको नाम", en: "Husband's name" }),
        citizenshipField("husbandCitizenshipNo", { ne: "पतिको नागरिकता नं.", en: "Husband's citizenship no." }),
        nameField("wifeName", { ne: "पत्नीको नाम", en: "Wife's name" }),
        citizenshipField("wifeCitizenshipNo", { ne: "पत्नीको नागरिकता नं.", en: "Wife's citizenship no." }),
        addressField("address", { ne: "ठेगाना", en: "Address" }),
        bsDateField("marriageDateBs", { ne: "विवाह मिति (वि.सं.)", en: "Date of marriage (BS)" }),
        bsDateField("separationDateBs", { ne: "छुट्टिएको मिति (वि.सं.)", en: "Date of separation (BS)" }, false),
      ],
    },
    {
      id: "terms",
      title: { ne: "सहमतिका सर्त", en: "Agreed terms" },
      intro: {
        ne: "सन्तान र सम्पत्तिका विषय अस्पष्ट भएमा पछि विवाद हुन्छ।",
        en: "Anything left vague about children or property is what comes back as a dispute.",
      },
      fields: [
        {
          id: "hasChildren",
          type: "select",
          required: true,
          label: { ne: "नाबालक सन्तान छन्?", en: "Are there minor children?" },
          options: [
            { value: "no", label: { ne: "छैनन्", en: "No" } },
            { value: "yes", label: { ne: "छन्", en: "Yes" } },
          ],
        },
        {
          id: "childArrangements",
          type: "textarea",
          label: { ne: "सन्तानको संरक्षण तथा भरणपोषण", en: "Custody and maintenance of children" },
        },
        {
          id: "propertyArrangements",
          type: "textarea",
          required: true,
          label: { ne: "सम्पत्ति बाँडफाँट", en: "Division of property" },
        },
        moneyField("maintenanceNpr", { ne: "मासिक भरणपोषण (रु.)", en: "Monthly maintenance (NPR)" }, undefined, false),
      ],
    },
  ],
  clauses: [
    {
      id: "heading",
      heading: { ne: "निवेदनको शीर्ष", en: "To the court" },
      locked: true,
      citation: DIVORCE,
      body: {
        ne: `श्रीमान् न्यायाधीशज्यू,\nसम्बन्धित जिल्ला अदालत।\n\nविषय: सहमतिमा सम्बन्ध विच्छेद गरिपाऊँ।`,
        en: `To the Hon'ble Judge,\nThe relevant District Court.\n\nSubject: Petition for divorce by mutual consent.`,
      },
    },
    {
      id: "parties",
      heading: { ne: "निवेदकहरू", en: "The petitioners" },
      body: {
        ne: `हामी {{husbandName}} (नागरिकता नं. {{husbandCitizenshipNo}}) र {{wifeName}} (नागरिकता नं. {{wifeCitizenshipNo}}), ठेगाना {{address}}, संयुक्त रूपमा यो निवेदन दिन्छौं।`,
        en: `We, {{husbandName}} (citizenship no. {{husbandCitizenshipNo}}) and {{wifeName}} (citizenship no. {{wifeCitizenshipNo}}), of {{address}}, jointly present this petition.`,
      },
    },
    {
      id: "marriage",
      heading: { ne: "विवाहको विवरण", en: "The marriage" },
      body: {
        ne: `हाम्रो विवाह मिति {{marriageDateBs}} मा सम्पन्न भएको थियो।`,
        en: `Our marriage was solemnised on {{marriageDateBs}}.`,
      },
    },
    {
      id: "separation",
      heading: { ne: "छुट्टिएको अवस्था", en: "Separation" },
      when: { field: "separationDateBs", op: "truthy" },
      body: {
        ne: `मिति {{separationDateBs}} देखि हामी अलग-अलग बसिरहेका छौं।`,
        en: `We have lived separately since {{separationDateBs}}.`,
      },
    },
    {
      id: "consent",
      heading: { ne: "सहमति", en: "Consent" },
      locked: true,
      citation: DIVORCE,
      body: {
        ne: `हामी दुवैले स्वस्थ चित्त र स्वतन्त्र इच्छाले, कसैको करकाप वा प्रभावमा नपरी, सम्बन्ध विच्छेद गर्न सहमति जनाएका छौं।`,
        en: `Both of us, of sound mind and acting freely and without coercion or undue influence, consent to the dissolution of our marriage.`,
      },
    },
    {
      id: "children",
      heading: { ne: "सन्तानको व्यवस्था", en: "Arrangements for the children" },
      when: { field: "hasChildren", op: "eq", value: "yes" },
      body: {
        ne: `नाबालक सन्तानको संरक्षण तथा भरणपोषण सम्बन्धमा हामीबीच देहायबमोजिम सहमति भएको छ:\n\n{{childArrangements}}`,
        en: `We have agreed the following in respect of custody and maintenance of the minor children:\n\n{{childArrangements}}`,
      },
    },
    {
      id: "maintenance",
      heading: { ne: "भरणपोषण", en: "Maintenance" },
      when: { field: "maintenanceNpr", op: "truthy" },
      body: {
        ne: `मासिक भरणपोषण बापत रु. {{maintenanceNpr}} दिने सहमति भएको छ।`,
        en: `Monthly maintenance of NPR {{maintenanceNpr}} has been agreed.`,
      },
    },
    {
      id: "property",
      heading: { ne: "सम्पत्ति बाँडफाँट", en: "Division of property" },
      body: {
        ne: `सम्पत्ति सम्बन्धमा हामीबीच देहायबमोजिम सहमति भएको छ:\n\n{{propertyArrangements}}`,
        en: `We have agreed the following in respect of property:\n\n{{propertyArrangements}}`,
      },
    },
    {
      id: "prayer",
      heading: { ne: "अनुरोध", en: "Prayer" },
      locked: true,
      citation: DIVORCE,
      body: {
        ne: `तसर्थ, माथिको व्यहोरा विचार गरी प्रचलित कानुनबमोजिम हाम्रो सम्बन्ध विच्छेद गरी फैसला गरिपाउँ भनी अनुरोध गर्दछौं। अदालतको फैसला नभएसम्म विवाह कायमै रहने कुरा हामीलाई जानकारी छ।`,
        en: `We therefore respectfully pray that the Court grant a decree dissolving our marriage in accordance with prevailing law. We understand that the marriage subsists until such a decree is granted.`,
      },
    },
  ],
};

/* ------------------------------------------------------------------ adoption */

/** Adoption deed. Like divorce, the paper records an agreement the law must ratify. */
export const adoptionDeed: Template = {
  slug: "adoption-deed",
  category: "family",
  priceNpr: 1_299,
  title: { ne: "धर्मपुत्र/धर्मपुत्री ग्रहणको लिखत", en: "Adoption Deed" },
  summary: {
    ne: "धर्मपुत्र वा धर्मपुत्री ग्रहण गर्ने लिखत। कानुनी प्रक्रिया पूरा नभई सम्बन्ध स्थापित हुँदैन।",
    en: "Deed recording an adoption. The relationship is not established until the legal process is completed.",
  },
  governingAct: ADOPTION,
  review: pendingReview(),
  execution: [
    {
      ne: "यो लिखतमा हस्ताक्षर गर्दैमा कानुनी रूपमा धर्मपुत्र/धर्मपुत्री सम्बन्ध स्थापित हुँदैन। प्रचलित कानुनबमोजिमको प्रक्रिया पूरा गर्नुपर्दछ।",
      en: "Signing this deed does not by itself create the legal relationship. The process prescribed by law must be completed.",
    },
    EXECUTION.twoWitnesses,
    EXECUTION.notarised,
    {
      ne: "उमेर, वैवाहिक अवस्था र सन्तानसम्बन्धी कानुनी सर्तहरू पूरा भएको हुनुपर्दछ — अधिवक्तासँग जाँच गराउनुहोस्।",
      en: "Statutory conditions on age, marital status and existing children must be satisfied. Have an advocate check them before proceeding.",
    },
  ],
  steps: [
    {
      id: "parties",
      title: { ne: "पक्षहरू", en: "The parties" },
      fields: [
        nameField("adopterName", { ne: "ग्रहण गर्नेको नाम", en: "Adopter's name" }),
        citizenshipField("adopterCitizenshipNo", { ne: "ग्रहण गर्नेको नागरिकता नं.", en: "Adopter's citizenship no." }),
        addressField("adopterAddress", { ne: "ग्रहण गर्नेको ठेगाना", en: "Adopter's address" }),
        nameField("childName", { ne: "बालबालिकाको नाम", en: "Child's name" }),
        bsDateField("childDobBs", { ne: "बालबालिकाको जन्म मिति (वि.सं.)", en: "Child's date of birth (BS)" }),
        nameField("guardianName", { ne: "दिने पक्ष (आमाबुबा/संरक्षक)", en: "Giving party (parent or guardian)" }),
        bsDateField("deedDateBs", { ne: "लिखत मिति (वि.सं.)", en: "Date of the deed (BS)" }),
      ],
    },
  ],
  clauses: [
    {
      id: "preamble",
      heading: { ne: "लिखतको प्रारम्भ", en: "Preamble" },
      locked: true,
      citation: ADOPTION,
      body: {
        ne: `यो लिखत {{deedDateBs}} मा {{adopterName}} (नागरिकता नं. {{adopterCitizenshipNo}}), ठेगाना {{adopterAddress}} र {{guardianName}} बीच सम्पन्न भएको छ।`,
        en: `This deed is made on {{deedDateBs}} between {{adopterName}} (citizenship no. {{adopterCitizenshipNo}}), of {{adopterAddress}}, and {{guardianName}}.`,
      },
    },
    {
      id: "consent",
      heading: { ne: "सहमति", en: "Consent" },
      citation: ADOPTION,
      body: {
        ne: `{{guardianName}} ले स्वस्थ चित्त र स्वतन्त्र इच्छाले, कुनै करकाप वा प्रलोभनबिना, {{childDobBs}} मा जन्मेका {{childName}} लाई {{adopterName}} को धर्मपुत्र/धर्मपुत्रीका रूपमा दिन मञ्जुर गरेका छन्।`,
        en: `{{guardianName}}, of sound mind and acting freely without coercion or inducement, agrees to give {{childName}}, born on {{childDobBs}}, in adoption to {{adopterName}}.`,
      },
    },
    {
      id: "undertaking",
      heading: { ne: "ग्रहण गर्नेको वचनबद्धता", en: "The adopter's undertaking" },
      body: {
        ne: `{{adopterName}} ले बालबालिकाको पालनपोषण, शिक्षा र हितको रक्षा आफ्नै सन्तानसरह गर्ने वचन दिन्छन्।`,
        en: `{{adopterName}} undertakes to maintain, educate and protect the welfare of the child as their own.`,
      },
    },
    {
      id: "process",
      heading: { ne: "कानुनी प्रक्रिया बाँकी", en: "The legal process remains" },
      locked: true,
      citation: ADOPTION,
      body: {
        ne: `यो लिखत पक्षहरूबीचको सहमतिको अभिलेख हो। प्रचलित कानुनबमोजिमको प्रक्रिया पूरा नभएसम्म कानुनी रूपमा धर्मपुत्र/धर्मपुत्री सम्बन्ध स्थापित भएको मानिने छैन।`,
        en: `This deed records the agreement between the parties. The legal relationship of adoption is not established until the process prescribed by prevailing law has been completed.`,
      },
    },
    governingLawClause(ADOPTION),
  ],
};

/* ------------------------------------------------------------------ affidavit */

/**
 * Affidavit.
 *
 * The one document in this catalogue where the risk runs toward the person signing
 * it. A false sworn statement is a criminal matter, which is stated on the face of
 * the document rather than assumed to be common knowledge.
 */
export const affidavit: Template = {
  slug: "affidavit",
  category: "family",
  priceNpr: 299,
  title: { ne: "स्वघोषणा (हलफनामा)", en: "Affidavit" },
  summary: {
    ne: "आफूले जानेको कुरा सत्य हो भनी गरिने लिखित घोषणा। झुट्ठा विवरण दिनु कानुनी अपराध हो।",
    en: "A written declaration that what it states is true. Making a false one is a criminal offence.",
  },
  governingAct: AFFIDAVIT,
  review: pendingReview(),
  execution: [
    EXECUTION.notarised,
    {
      ne: "घोषणाकर्ता स्वयं उपस्थित भई नोटरी वा अधिकारप्राप्त अधिकारीसमक्ष हस्ताक्षर गर्नुपर्दछ।",
      en: "The declarant must attend in person and sign before a notary or authorised officer.",
    },
    {
      ne: "झुट्ठा विवरण दिएमा प्रचलित कानुनबमोजिम कारबाही हुन्छ।",
      en: "A false statement attracts action under prevailing law.",
    },
  ],
  steps: [
    {
      id: "declarant",
      title: { ne: "घोषणाकर्ता", en: "The declarant" },
      fields: [
        nameField("declarantName", { ne: "पूरा नाम", en: "Full name" }),
        citizenshipField("declarantCitizenshipNo", { ne: "नागरिकता नं.", en: "Citizenship no." }),
        addressField("declarantAddress", { ne: "ठेगाना", en: "Address" }),
        nameField("fatherName", { ne: "बुबाको नाम", en: "Father's name" }, false),
        bsDateField("declarationDateBs", { ne: "मिति (वि.सं.)", en: "Date (BS)" }),
      ],
    },
    {
      id: "statement",
      title: { ne: "घोषणाको व्यहोरा", en: "What you are declaring" },
      intro: {
        ne: "आफूलाई थाहा भएको र सत्य ठानेको कुरा मात्र लेख्नुहोस्।",
        en: "State only what you know to be true. This document is relied on precisely because it carries consequences if it is not.",
      },
      fields: [
        {
          id: "purpose",
          type: "text",
          required: true,
          label: { ne: "प्रयोजन", en: "Purpose" },
          placeholder: { ne: "जस्तै: नाम फरक परेको सम्बन्धमा", en: "e.g. regarding a discrepancy in my name" },
        },
        {
          id: "statement",
          type: "textarea",
          required: true,
          label: { ne: "घोषणा गरिने व्यहोरा", en: "The statement" },
        },
      ],
    },
  ],
  clauses: [
    {
      id: "heading",
      heading: { ne: "स्वघोषणा", en: "Affidavit" },
      locked: true,
      citation: AFFIDAVIT,
      body: {
        ne: `म {{declarantName}} (नागरिकता प्रमाणपत्र नं. {{declarantCitizenshipNo}}), ठेगाना {{declarantAddress}}, मिति {{declarationDateBs}} मा देहायबमोजिम स्वघोषणा गर्दछु।`,
        en: `I, {{declarantName}} (citizenship certificate no. {{declarantCitizenshipNo}}), of {{declarantAddress}}, do hereby solemnly declare on {{declarationDateBs}} as follows.`,
      },
    },
    {
      id: "purpose",
      heading: { ne: "प्रयोजन", en: "Purpose" },
      body: {
        ne: `यो स्वघोषणा {{purpose}} को प्रयोजनका लागि गरिएको हो।`,
        en: `This declaration is made for the purpose of {{purpose}}.`,
      },
    },
    {
      id: "statement",
      heading: { ne: "व्यहोरा", en: "Statement" },
      body: {
        ne: `{{statement}}`,
        en: `{{statement}}`,
      },
    },
    {
      id: "truth",
      heading: { ne: "सत्यताको घोषणा", en: "Declaration of truth" },
      locked: true,
      citation: FALSE_STATEMENT,
      body: {
        ne: `माथि लेखिएको व्यहोरा साँचो हो। झुट्ठा ठहरे प्रचलित कानुनबमोजिम सहुँला बुझाउँला।`,
        en: `What is stated above is true. Should it be found false, I accept liability under prevailing law.`,
      },
    },
  ],
};

/* ------------------------------------------------------------------ legal notice */

/** Demand letter — the step before litigation, and often the one that ends it. */
export const legalNotice: Template = {
  slug: "legal-notice",
  category: "family",
  priceNpr: 499,
  title: { ne: "कानुनी सूचना (ताकेता पत्र)", en: "Legal Notice / Demand Letter" },
  summary: {
    ne: "मुद्दा हाल्नुअघि विपक्षी पक्षलाई पठाइने औपचारिक सूचना। धेरै विवाद यहीँ टुंगिन्छन्।",
    en: "Formal notice to the other side before litigation. A great many disputes end here rather than in court.",
  },
  governingAct: CONTRACT,
  review: pendingReview(),
  execution: [
    {
      ne: "दर्ता गरिएको हुलाक वा बुझेको भरपाईसहित पठाउनुहोस्। पठाएको प्रमाण नभए सूचना दिइएकै मानिँदैन।",
      en: "Send by registered post or against a signed acknowledgement. Without proof of service the notice may as well not have been sent.",
    },
    {
      ne: "पठाएको प्रति र प्रमाण सुरक्षित राख्नुहोस् — पछि अदालतमा आवश्यक पर्दछ।",
      en: "Keep a copy and the proof of service; the court will want both.",
    },
  ],
  steps: [
    {
      id: "parties",
      title: { ne: "पक्षहरू", en: "The parties" },
      fields: [
        nameField("senderName", { ne: "पठाउनेको नाम", en: "Sender's name" }),
        addressField("senderAddress", { ne: "पठाउनेको ठेगाना", en: "Sender's address" }),
        nameField("recipientName", { ne: "पाउनेको नाम", en: "Recipient's name" }),
        addressField("recipientAddress", { ne: "पाउनेको ठेगाना", en: "Recipient's address" }),
        bsDateField("noticeDateBs", { ne: "सूचना मिति (वि.सं.)", en: "Date of notice (BS)" }),
      ],
    },
    {
      id: "claim",
      title: { ne: "दाबीको विवरण", en: "The claim" },
      fields: [
        {
          id: "background",
          type: "textarea",
          required: true,
          label: { ne: "पृष्ठभूमि", en: "Background" },
          help: {
            ne: "के भयो, कहिले भयो — मिति र तथ्यसहित लेख्नुहोस्।",
            en: "What happened and when. Dates and facts, not adjectives — this may be read out in court.",
          },
        },
        {
          id: "demand",
          type: "textarea",
          required: true,
          label: { ne: "माग", en: "What you are demanding" },
        },
        moneyField("amountNpr", { ne: "दाबी रकम (रु.)", en: "Amount claimed (NPR)" }, undefined, false),
        {
          id: "deadlineDays",
          type: "number",
          required: true,
          label: { ne: "जवाफका लागि दिइएको समय (दिन)", en: "Days allowed to respond" },
          help: {
            ne: "अत्यन्त छोटो समय दिँदा सूचना अनुचित देखिन सक्दछ।",
            en: "An unreasonably short deadline can make the notice look like a manoeuvre rather than a genuine demand.",
          },
        },
      ],
    },
  ],
  clauses: [
    {
      id: "heading",
      heading: { ne: "सूचनाको शीर्ष", en: "Notice" },
      locked: true,
      body: {
        ne: `मिति: {{noticeDateBs}}\n\nश्री {{recipientName}}\n{{recipientAddress}}\n\nविषय: कानुनी सूचना।`,
        en: `Date: {{noticeDateBs}}\n\nTo: {{recipientName}}\n{{recipientAddress}}\n\nSubject: Legal notice.`,
      },
    },
    {
      id: "background",
      heading: { ne: "पृष्ठभूमि", en: "Background" },
      body: {
        ne: `{{background}}`,
        en: `{{background}}`,
      },
    },
    {
      id: "demand",
      heading: { ne: "माग", en: "Demand" },
      citation: CONTRACT,
      body: {
        ne: `तसर्थ यस सूचनाद्वारा देहायबमोजिम माग गरिन्छ:\n\n{{demand}}`,
        en: `You are accordingly required to do the following:\n\n{{demand}}`,
      },
    },
    {
      id: "amount",
      heading: { ne: "दाबी रकम", en: "Amount claimed" },
      when: { field: "amountNpr", op: "truthy" },
      body: {
        ne: `उपरोक्त सम्बन्धमा रु. {{amountNpr}} भुक्तानी गर्नुपर्ने देखिन्छ।`,
        en: `The sum of NPR {{amountNpr}} is claimed in respect of the above.`,
      },
    },
    {
      id: "deadline",
      heading: { ne: "समयसीमा", en: "Time to comply" },
      locked: true,
      body: {
        ne: `यो सूचना प्राप्त भएको मितिले {{deadlineDays}} दिनभित्र माथिको माग पूरा गर्नुहुन अनुरोध छ। सो अवधिभित्र जवाफ नआएमा वा माग पूरा नभएमा प्रचलित कानुनबमोजिम उपचारका लागि अगाडि बढ्नुपर्ने हुनेछ।`,
        en: `You are asked to comply within {{deadlineDays}} days of receiving this notice. If you do not respond or comply within that period, remedies available under prevailing law will be pursued.`,
      },
    },
    {
      id: "sender",
      heading: { ne: "पठाउने", en: "From" },
      locked: true,
      body: {
        ne: `{{senderName}}\n{{senderAddress}}`,
        en: `{{senderName}}\n{{senderAddress}}`,
      },
    },
  ],
};
