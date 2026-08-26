import type { Lang, Bilingual } from "./types";

/**
 * UI strings.
 *
 * Every user-facing string is a key from day one. Retrofitting bilingual support
 * later would mean rewriting every render path, and Nepali is the authoritative
 * language for the documents themselves.
 */
const STRINGS = {
  brandName: { ne: "मण्डल ल", en: "Mandala Law" },
  brandTagline: {
    ne: "नेपाली कानुनअनुसार तयार पारिएका कागजात",
    en: "Legal documents built for Nepali law",
  },

  navDocuments: { ne: "कागजात", en: "Documents" },
  navServices: { ne: "सेवा", en: "Services" },
  navPricing: { ne: "मूल्य", en: "Pricing" },
  navDashboard: { ne: "मेरो खाता", en: "Dashboard" },
  login: { ne: "लगइन", en: "Log in" },

  heroTitle: {
    ne: "नेपाली कानुनले चिन्ने कागजात, केही मिनेटमै",
    en: "Documents Nepali law recognises, in minutes",
  },
  heroBody: {
    ne: "प्रत्येक धारा प्रचलित ऐनको दफासँग जोडिएको छ र नेपाल बार काउन्सिलमा दर्ता भएका अधिवक्ताबाट पुनरावलोकन गरिएको हुन्छ।",
    en: "Every clause is tied to the provision it comes from and reviewed by advocates registered with the Nepal Bar Council.",
  },
  searchPlaceholder: {
    ne: "कागजात खोज्नुहोस् — जस्तै रोजगार करार",
    en: "Search documents — try 'employment contract'",
  },
  search: { ne: "खोज्नुहोस्", en: "Search" },

  trustLicensed: { ne: "बार काउन्सिल दर्ता", en: "Bar Council registered" },
  trustReviewed: { ne: "अधिवक्ताद्वारा पुनरावलोकित", en: "Advocate reviewed" },
  trustCited: { ne: "दफा उद्धृत", en: "Statute cited" },

  popularCategories: { ne: "मुख्य वर्गहरू", en: "Categories" },
  allDocuments: { ne: "सबै कागजात", en: "All documents" },
  documentsCount: { ne: "कागजात", en: "documents" },
  startDocument: { ne: "सुरु गर्नुहोस्", en: "Start this document" },
  comingSoon: { ne: "तयारीमा", en: "Coming soon" },

  complianceHookTitle: {
    ne: "के तपाईंको कम्पनी श्रम ऐन अनुसार छ?",
    en: "Is your company compliant with the Labour Act?",
  },
  complianceHookBody: {
    ne: "श्रम ऐन, २०७४ को दफा ११ ले आकस्मिक श्रमिक बाहेक सबै कर्मचारीसँग लिखित करार अनिवार्य गरेको छ। नभएमा रु. ५,००० देखि रु. २५,००० सम्म जरिवाना हुन सक्दछ।",
    en: "Labour Act 2074 §11 requires a written contract for every employee other than casual workers. Non-compliance carries a fine of NPR 5,000 to 25,000.",
  },

  stepOf: { ne: "चरण", en: "Step" },
  of: { ne: "मध्ये", en: "of" },
  back: { ne: "पछाडि", en: "Back" },
  continue: { ne: "अगाडि", en: "Continue" },
  saveDraft: { ne: "ड्राफ्ट सुरक्षित", en: "Save draft" },
  reviewAndPay: { ne: "पुनरावलोकन र भुक्तानी", en: "Review and pay" },

  livePreview: { ne: "प्रत्यक्ष पूर्वावलोकन", en: "Live preview" },
  whyAsked: { ne: "यो किन सोधिएको हो", en: "Why this is asked" },
  governedBy: { ne: "आधार", en: "Governed by" },
  statutoryLocked: {
    ne: "कानुनद्वारा निर्धारित — घटाउन मिल्दैन",
    en: "Fixed by statute — cannot be reduced",
  },
  blockedTitle: {
    ne: "यो कागजात सिर्जना गर्न सकिँदैन",
    en: "This document cannot be generated",
  },
  blockedBody: {
    ne: "तलका सर्तहरू प्रचलित कानुनविपरीत छन्। सच्याएपछि मात्र अगाडि बढ्न सकिन्छ।",
    en: "The values below conflict with prevailing law. They must be corrected before the document can be produced.",
  },
  warningTitle: { ne: "ध्यान दिनुहोस्", en: "Worth checking" },

  reviewedOn: { ne: "पुनरावलोकन मिति", en: "Reviewed" },
  nbcLicence: { ne: "बार काउन्सिल इजाजत नं.", en: "NBC licence no." },

  orderSummary: { ne: "अर्डर विवरण", en: "Order summary" },
  total: { ne: "जम्मा", en: "Total" },
  paymentMethod: { ne: "भुक्तानी विधि", en: "Payment method" },
  payNow: { ne: "भुक्तानी गर्नुहोस्", en: "Pay now" },
  executionTitle: {
    ne: "कागजात मान्य हुन के-के गर्नुपर्छ",
    en: "What this document still needs",
  },
  executionNote: {
    ne: "डाउनलोड गर्दैमा कागजात सम्पन्न हुँदैन। तलका काम पूरा गरेपछि मात्र यो कानुनी रूपमा प्रभावकारी हुन्छ।",
    en: "Downloading is not execution. The document becomes legally effective only once the steps below are completed.",
  },
  addAdvocateReview: { ne: "अधिवक्ताबाट पुनरावलोकन थप्नुहोस्", en: "Add advocate review" },

  previewWatermark: { ne: "नमुना", en: "PREVIEW" },
  unlockFull: { ne: "पूरा कागजात खोल्नुहोस्", en: "Unlock the full document" },
  unlockBody: {
    ne: "भुक्तानीपछि वाटरमार्कबिनाको पूरा कागजात नेपाली र अंग्रेजी दुवैमा डाउनलोड गर्न सकिन्छ।",
    en: "After payment the complete document downloads without a watermark, in both Nepali and English.",
  },

  disclaimerTitle: { ne: "कानुनी सूचना", en: "Legal notice" },
  disclaimer: {
    ne: "यो कागजात सामान्य जानकारीका लागि तयार पारिएको हो। तपाईंको विशिष्ट अवस्थाका लागि अधिवक्तासँग परामर्श गर्नुहोस्।",
    en: "This document is provided for general use. For your specific circumstances, consult an advocate at the firm.",
  },
} as const;

export type StringKey = keyof typeof STRINGS;

export function t(key: StringKey, lang: Lang): string {
  return STRINGS[key][lang];
}

export function bi(value: Bilingual, lang: Lang): string {
  return value[lang];
}

export const OTHER_LANG: Record<Lang, Lang> = { ne: "en", en: "ne" };
export const LANG_LABEL: Record<Lang, string> = { ne: "नेपाली", en: "English" };
