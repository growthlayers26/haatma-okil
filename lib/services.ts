import type { Bilingual } from "./types";

/**
 * Services the firm sells beyond a document download.
 *
 * Flat per-matter fees, which is how Nepali clients already buy legal work. No
 * referral commission and no revenue share on matched work — the Bar Council Rules
 * of Conduct 2079 prohibit paying commission for cases, so the firm bills its own
 * clients directly for its own advocates' time.
 */

export type ServiceId = "question" | "consultation" | "document_review" | "company_registration";

export type Service = {
  id: ServiceId;
  title: Bilingual;
  blurb: Bilingual;
  priceNpr: number;
  /** Stated turnaround, shown before purchase so the client can hold us to it. */
  turnaround: Bilingual;
};

export const SERVICES: Record<ServiceId, Service> = {
  question: {
    id: "question",
    title: { ne: "लिखित प्रश्न", en: "Written question" },
    blurb: {
      ne: "फर्मका इजाजतप्राप्त अधिवक्ताबाट लिखित जवाफ।",
      en: "A written answer from a licensed advocate at the firm.",
    },
    priceNpr: 1_500,
    turnaround: { ne: "एक कार्य दिनभित्र", en: "Within one working day" },
  },
  consultation: {
    id: "consultation",
    title: { ne: "प्रत्यक्ष परामर्श", en: "Live consultation" },
    blurb: {
      ne: "फोन वा भेटघाटमार्फत ३० मिनेटको परामर्श।",
      en: "A 30-minute consultation by phone or in person.",
    },
    priceNpr: 4_000,
    turnaround: { ne: "३ कार्य दिनभित्र समय मिलाइनेछ", en: "Scheduled within 3 working days" },
  },
  document_review: {
    id: "document_review",
    title: { ne: "कागजात पुनरावलोकन", en: "Document review" },
    blurb: {
      ne: "तपाईंको कागजात अधिवक्ताले हेरी लिखित सुझाव दिनुहुनेछ।",
      en: "An advocate reads your document and returns written comments.",
    },
    priceNpr: 2_500,
    turnaround: { ne: "दुई कार्य दिनभित्र", en: "Within two working days" },
  },
  company_registration: {
    id: "company_registration",
    title: { ne: "कम्पनी दर्ता", en: "Company registration" },
    blurb: {
      ne: "प्रबन्धपत्र र नियमावली तयारी, नाम स्वीकृति र दर्तापछिका दायित्वको मार्गदर्शन।",
      en: "MOA and AOA drafting, name clearance, and the post-registration chain.",
    },
    priceNpr: 9_999,
    turnaround: { ne: "५–१० कार्य दिन", en: "5–10 working days" },
  },
};

/** Government fees are collected separately and never marked up. */
export const GOVERNMENT_FEE_NOTE: Bilingual = {
  ne: "सरकारी दस्तुर छुट्टै लाग्नेछ र त्यसमा कुनै सेवा शुल्क थपिने छैन।",
  en: "Government fees are payable separately and are passed through without markup.",
};

export const AREAS_OF_LAW: { id: string; label: Bilingual }[] = [
  { id: "employment", label: { ne: "रोजगारी तथा श्रम", en: "Employment and labour" } },
  { id: "property", label: { ne: "घरजग्गा", en: "Property" } },
  { id: "business", label: { ne: "व्यापार तथा कम्पनी", en: "Business and company" } },
  { id: "family", label: { ne: "पारिवारिक", en: "Family" } },
  { id: "other", label: { ne: "अन्य", en: "Other" } },
];
