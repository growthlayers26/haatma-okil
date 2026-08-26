import type { Bilingual, Citation } from "./types";
import { ACTS, TRADEMARK, cite } from "./nepal";

/**
 * Government filing services.
 *
 * Same principle as company registration: the government portals are free and
 * already online, so this sells none of them. What it sells is the work that decides
 * whether a filing succeeds — the classification call on a trademark, the judgement
 * of whether a business should register for VAT at all — plus the follow-through.
 *
 * Fee honesty is structural here. Every government fee carries a `verified` flag, and
 * unverified figures render as "confirm the current rate" rather than as a number the
 * user might rely on. Statutory fees change by notice more often than acts are
 * amended, and a confidently wrong fee is worse than an admitted unknown.
 */

export type Payer = "us" | "you" | "government";

export type FilingFee = {
  label: Bilingual;
  /** Null when the amount depends on the case or has not been confirmed. */
  amountNpr: number | null;
  note: Bilingual;
  /**
   * False until an advocate at the firm confirms the current rate against the
   * relevant notice. Unverified fees are never rendered as a bare figure.
   */
  verified: boolean;
};

export type FilingStep = {
  label: Bilingual;
  detail: Bilingual;
  who: Payer;
};

export type Pitfall = {
  label: Bilingual;
  detail: Bilingual;
};

export type FilingService = {
  id: "trademark" | "tax_registration";
  title: Bilingual;
  blurb: Bilingual;
  authority: Bilingual;
  portal: string;
  statute: Citation;
  ourFeeNpr: number;
  turnaround: Bilingual;
  governmentFees: FilingFee[];
  steps: FilingStep[];
  pitfalls: Pitfall[];
};

const UNVERIFIED: Bilingual = {
  ne: "प्रचलित दर सम्बन्धित कार्यालयबाट पुष्टि गरिनेछ।",
  en: "The current rate is confirmed with the office before filing.",
};

/* ------------------------------------------------------------------ trademark */

export const trademarkFiling: FilingService = {
  id: "trademark",
  title: { ne: "ट्रेडमार्क दर्ता", en: "Trademark registration" },
  blurb: {
    ne: "उद्योग विभागमा ट्रेडमार्क दर्ता। वर्ग छनौट, पूर्व-खोज र दर्ता प्रक्रिया समावेश।",
    en: "Register a trademark at the Department of Industry — search, classification, filing and follow-through.",
  },
  authority: { ne: "उद्योग विभाग", en: "Department of Industry" },
  portal: "doind.gov.np",
  statute: TRADEMARK,
  ourFeeNpr: 12_999,
  turnaround: { ne: "दर्ता प्रक्रिया सामान्यतया केही महिना लाग्दछ", en: "Registration typically takes several months" },
  governmentFees: [
    {
      label: { ne: "दर्ता आवेदन दस्तुर", en: "Application fee" },
      amountNpr: null,
      note: UNVERIFIED,
      verified: false,
    },
    {
      label: { ne: "प्रति वर्ग थप दस्तुर", en: "Additional fee per class" },
      amountNpr: null,
      note: {
        ne: "एकभन्दा बढी वर्गमा दर्ता गर्दा प्रत्येक वर्गको छुट्टै दस्तुर लाग्दछ।",
        en: "Registering in more than one class attracts a separate fee for each class.",
      },
      verified: false,
    },
  ],
  steps: [
    {
      label: { ne: "पूर्व-खोज", en: "Availability search" },
      detail: {
        ne: "उस्तै वा मिल्दोजुल्दो चिह्न पहिले दर्ता भइसकेको छ कि छैन जाँच गरिन्छ।",
        en: "We check whether the same or a confusingly similar mark is already registered.",
      },
      who: "us",
    },
    {
      label: { ne: "वर्ग निर्धारण", en: "Classification" },
      detail: {
        ne: "तपाईंको वास्तविक कारोबार समेट्ने वर्ग छनौट गरिन्छ। यही निर्णयले संरक्षणको दायरा तय गर्दछ।",
        en: "We choose the class or classes that cover what the business actually sells. This single decision defines the scope of your protection.",
      },
      who: "us",
    },
    {
      label: { ne: "आवेदन दर्ता", en: "Filing" },
      detail: {
        ne: "चिह्नको नमुनासहित उद्योग विभागमा आवेदन दर्ता गरिन्छ।",
        en: "The application is filed at the Department of Industry with a representation of the mark.",
      },
      who: "us",
    },
    {
      label: { ne: "जाँच", en: "Examination" },
      detail: {
        ne: "विभागले आवेदन जाँच गर्दछ र आवश्यक भए थप विवरण माग्न सक्दछ।",
        en: "The Department examines the application and may raise queries requiring a response.",
      },
      who: "government",
    },
    {
      label: { ne: "प्रकाशन तथा विरोध अवधि", en: "Publication and opposition" },
      detail: {
        ne: "चिह्न औद्योगिक सम्पत्ति बुलेटिनमा प्रकाशित हुन्छ। सो अवधिभित्र कसैले विरोध जनाउन सक्दछ।",
        en: "The mark is published in the Industrial Property Bulletin. Anyone may oppose it during the notice period.",
      },
      who: "government",
    },
    {
      label: { ne: "दर्ता प्रमाणपत्र", en: "Certificate" },
      detail: {
        ne: "विरोध नआएमा वा विरोध खारेज भएमा दर्ता प्रमाणपत्र जारी हुन्छ। दर्ता निश्चित अवधिपछि नवीकरण गर्नुपर्दछ।",
        en: "If no opposition succeeds, the certificate issues. Registration must be renewed at the end of its term.",
      },
      who: "government",
    },
  ],
  pitfalls: [
    {
      label: { ne: "गलत वर्गमा दर्ता", en: "Filing in the wrong class" },
      detail: {
        ne: "व्यवसायले वास्तवमा बेच्ने वस्तु वा सेवा नसमेट्ने वर्गमा दर्ता गरेमा संरक्षण नाममात्रको हुन्छ। वर्ग पछि थप्न नयाँ आवेदन नै चाहिन्छ।",
        en: "A mark registered in a class that does not cover what you actually sell gives protection in name only — and adding a class later means a fresh application, not an amendment.",
      },
    },
    {
      label: { ne: "प्रयोग गरिसकेपछि मात्र दर्ता", en: "Trading first, filing later" },
      detail: {
        ne: "चिह्न प्रयोग सुरु गरेर लामो समयपछि दर्ता गर्न खोज्दा त्यही बीचमा अरूले दर्ता गराइसकेको हुन सक्दछ।",
        en: "Using a mark for a year before filing leaves an opening for someone else to register it in the meantime.",
      },
    },
    {
      label: { ne: "नवीकरण छुट्नु", en: "Missing the renewal" },
      detail: {
        ne: "नवीकरण नगरेमा दर्ता लोप हुन्छ र चिह्न अरूले दर्ता गर्न खुला हुन्छ।",
        en: "A registration that is not renewed lapses, and the mark becomes available for others to register.",
      },
    },
  ],
};

/* ------------------------------------------------------------------ tax */

export const taxRegistrationFiling: FilingService = {
  id: "tax_registration",
  title: { ne: "स्थायी लेखा नम्बर तथा मूल्य अभिवृद्धि कर दर्ता", en: "PAN and VAT registration" },
  blurb: {
    ne: "आन्तरिक राजस्व कार्यालयमा स्थायी लेखा नम्बर (PAN) र आवश्यक भएमा मूल्य अभिवृद्धि कर (VAT) दर्ता।",
    en: "Register for a Permanent Account Number at the Inland Revenue Office, and for VAT where it is actually required.",
  },
  authority: { ne: "आन्तरिक राजस्व विभाग", en: "Inland Revenue Department" },
  portal: "ird.gov.np",
  statute: cite(ACTS.incomeTax, "दर्ता सम्बन्धी व्यवस्था", "provisions on registration"),
  ourFeeNpr: 4_999,
  turnaround: { ne: "३–७ कार्य दिन", en: "3–7 working days" },
  governmentFees: [
    {
      label: { ne: "स्थायी लेखा नम्बर दर्ता", en: "PAN registration" },
      amountNpr: 0,
      note: {
        ne: "स्थायी लेखा नम्बर दर्ता गर्न सरकारी दस्तुर लाग्दैन।",
        en: "There is no government fee to register for a PAN.",
      },
      verified: true,
    },
    {
      label: { ne: "मूल्य अभिवृद्धि कर दर्ता", en: "VAT registration" },
      amountNpr: null,
      note: UNVERIFIED,
      verified: false,
    },
  ],
  steps: [
    {
      label: { ne: "आवश्यकता निर्धारण", en: "Deciding what you actually need" },
      detail: {
        ne: "सबै व्यवसायलाई मूल्य अभिवृद्धि करमा दर्ता हुनु पर्दैन। तपाईंको कारोबार र प्रकृति हेरी निर्णय गरिन्छ।",
        en: "Not every business needs to be VAT registered. We look at your turnover and what you sell before advising either way.",
      },
      who: "us",
    },
    {
      label: { ne: "कागजात तयारी", en: "Preparing the file" },
      detail: {
        ne: "कम्पनी दर्ता प्रमाणपत्र, नागरिकता, फोटो र स्थान सम्बन्धी कागजात तयार गरिन्छ।",
        en: "Registration certificate, citizenship, photographs and proof of premises are assembled.",
      },
      who: "us",
    },
    {
      label: { ne: "अनलाइन दर्ता", en: "Online submission" },
      detail: {
        ne: "आन्तरिक राजस्व विभागको प्रणालीमार्फत आवेदन पेस गरिन्छ।",
        en: "The application is submitted through the Inland Revenue Department's system.",
      },
      who: "us",
    },
    {
      label: { ne: "कार्यालयमा उपस्थिति", en: "Attending the office" },
      detail: {
        ne: "बायोमेट्रिक तथा पहिचान प्रमाणीकरणका लागि करदाता स्वयं आन्तरिक राजस्व कार्यालय जानुपर्दछ। यो काम अरूले गरिदिन मिल्दैन।",
        en: "The taxpayer must attend the Inland Revenue Office in person for biometric and identity verification. This step cannot be done on your behalf.",
      },
      who: "you",
    },
    {
      label: { ne: "प्रमाणपत्र जारी", en: "Certificate issued" },
      detail: {
        ne: "प्रमाणीकरणपछि स्थायी लेखा नम्बर तथा दर्ता प्रमाणपत्र जारी हुन्छ।",
        en: "Once verified, the PAN and registration certificate are issued.",
      },
      who: "government",
    },
  ],
  pitfalls: [
    {
      label: { ne: "आवश्यक नभई मूल्य अभिवृद्धि करमा दर्ता", en: "Registering for VAT when you did not have to" },
      detail: {
        ne: "आवश्यक नभई मूल्य अभिवृद्धि करमा दर्ता भएमा कारोबार शून्य भए पनि हरेक महिना विवरण बुझाउने स्थायी दायित्व सिर्जना हुन्छ। नबुझाएमा जरिवाना लाग्दछ। यो सबैभन्दा महँगो र सबैभन्दा सजिलै हुने गल्ती हो।",
        en: "Registering for VAT you did not need creates a permanent monthly filing obligation — due even in months with no trading at all, with penalties for missing it. This is the most expensive and most common mistake we see, and it is very hard to undo.",
      },
    },
    {
      label: { ne: "कारोबार सुरु गरेपछि दर्ता", en: "Trading before registering" },
      detail: {
        ne: "स्थायी लेखा नम्बरबिना बिजक जारी गर्न मिल्दैन र ठूला ग्राहकले भुक्तानी दिन मान्दैनन्।",
        en: "You cannot issue a compliant invoice without a PAN, and larger customers will not pay against one.",
      },
    },
    {
      label: { ne: "दर्तापछि विवरण नबुझाउनु", en: "Registering and then going quiet" },
      detail: {
        ne: "दर्ता भएपछि कारोबार नभए पनि तोकिएको समयमा विवरण बुझाउनुपर्दछ। नबुझाएको अभिलेख पछि ऋण वा ठेक्का लिँदा बाधक बन्दछ।",
        en: "Once registered, returns are due on time whether or not you traded. A record of missed filings surfaces later when you seek a loan or bid for a contract.",
      },
    },
  ],
};

export const FILINGS: Record<FilingService["id"], FilingService> = {
  trademark: trademarkFiling,
  tax_registration: taxRegistrationFiling,
};
