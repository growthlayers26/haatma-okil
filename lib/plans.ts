import type { Bilingual } from "./types";

/**
 * Subscription plans.
 *
 * The deliberate divergence from Rocket Lawyer: they are subscription-led, with
 * documents free at the margin and the membership as the product. Here the entry
 * point stays per-document, and a plan is what you move to once you are buying
 * several a year. Card-on-file recurring billing is a weak assumption in a
 * wallet-first market, so the business cannot rest on it.
 *
 * Consequence: `free` is not a trial. It is a permanent, functional tier where
 * documents are bought individually — which is how most users will stay.
 */

export type PlanId = "free" | "business" | "enterprise";
export type BillingPeriod = "monthly" | "annual";

export type Entitlements = {
  /** null means unlimited. 0 means the tier pays per document instead. */
  documentsPerYear: number | null;
  /** Written advocate questions included per month. Beyond this, pay per matter. */
  questionsPerMonth: number;
  /** Document reviews by an advocate, per month. */
  reviewsPerMonth: number;
  /** Seats on one account. Enterprise multi-user lands in a later chunk. */
  seats: number;
  customTemplates: boolean;
  approvalWorkflow: boolean;
  prioritySupport: boolean;
};

export type Plan = {
  id: PlanId;
  name: Bilingual;
  tagline: Bilingual;
  /** Annual price in NPR. 0 for free. */
  annualNpr: number;
  /**
   * Monthly price in NPR, carrying a premium over annual.
   *
   * Offered because a NPR 7,999 upfront charge is a real conversion barrier in a
   * market where most people pay from a wallet balance rather than a card. The
   * premium is what pays for the churn risk of a monthly commitment.
   */
  monthlyNpr: number;
  entitlements: Entitlements;
  /** Shown as the plan's selling points. Ordered by what actually decides the sale. */
  highlights: Bilingual[];
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: { ne: "नि:शुल्क", en: "Free" },
    tagline: {
      ne: "कागजात हेर्न र तयार गर्न नि:शुल्क। किन्दा मात्र तिर्नुहोस्।",
      en: "Draft and preview at no cost. Pay only for the documents you take.",
    },
    annualNpr: 0,
    monthlyNpr: 0,
    entitlements: {
      documentsPerYear: 0,
      questionsPerMonth: 0,
      reviewsPerMonth: 0,
      seats: 1,
      customTemplates: false,
      approvalWorkflow: false,
      prioritySupport: false,
    },
    highlights: [
      { ne: "सबै कागजात हेर्न र तयार गर्न पाइने", en: "Draft and preview every template" },
      { ne: "कानुनी आधार र दफा सहित", en: "Statutory citations on every clause" },
      { ne: "कागजातको मूल्य छुट्टै तिर्नुपर्ने", en: "Documents charged individually" },
      { ne: "अधिवक्ता सेवा प्रति विषय शुल्क", en: "Advocate services charged per matter" },
    ],
  },

  business: {
    id: "business",
    name: { ne: "व्यवसाय", en: "Business" },
    tagline: {
      ne: "वर्षभरि असीमित कागजात र हरेक महिना अधिवक्तासँग प्रश्न।",
      en: "Unlimited documents through the year, with advocate questions every month.",
    },
    annualNpr: 7_999,
    monthlyNpr: 799,
    entitlements: {
      documentsPerYear: null,
      questionsPerMonth: 5,
      reviewsPerMonth: 2,
      seats: 3,
      customTemplates: false,
      approvalWorkflow: false,
      prioritySupport: false,
    },
    highlights: [
      { ne: "असीमित कागजात", en: "Unlimited documents" },
      { ne: "मासिक ५ लिखित प्रश्न अधिवक्तालाई", en: "5 written advocate questions a month" },
      { ne: "मासिक २ कागजात पुनरावलोकन", en: "2 document reviews a month" },
      { ne: "३ जनासम्म प्रयोगकर्ता", en: "Up to 3 users" },
      { ne: "कानुन संशोधन भएमा सूचना", en: "Alerts when a statute behind your document changes" },
    ],
  },

  enterprise: {
    id: "enterprise",
    name: { ne: "संस्थागत", en: "Enterprise" },
    tagline: {
      ne: "ठूला संस्थाका लागि। आफ्नै ढाँचा, स्वीकृति प्रक्रिया र प्राथमिकता।",
      en: "For larger organisations. Your own templates, an approval chain, and priority.",
    },
    annualNpr: 24_999,
    monthlyNpr: 2_499,
    entitlements: {
      documentsPerYear: null,
      questionsPerMonth: 20,
      reviewsPerMonth: 10,
      seats: 25,
      customTemplates: true,
      approvalWorkflow: true,
      prioritySupport: true,
    },
    highlights: [
      { ne: "व्यवसाय योजनाका सबै सुविधा", en: "Everything in Business" },
      { ne: "मासिक २० लिखित प्रश्न", en: "20 written advocate questions a month" },
      { ne: "२५ जनासम्म प्रयोगकर्ता", en: "Up to 25 users" },
      { ne: "आफ्नै कागजात ढाँचा", en: "Your own document templates" },
      { ne: "आन्तरिक स्वीकृति प्रक्रिया", en: "Internal approval workflow" },
      { ne: "प्राथमिकतामा जवाफ", en: "Priority turnaround" },
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "business", "enterprise"];

/** Price for a plan on a given billing period. Free is always 0. */
export function planPriceNpr(id: PlanId, period: BillingPeriod): number {
  const plan = PLANS[id];
  if (!plan) return 0;
  return period === "annual" ? plan.annualNpr : plan.monthlyNpr;
}

/**
 * What an annual commitment saves against paying monthly, as a percentage.
 * Computed rather than written down, so the two prices cannot drift apart.
 */
export function annualSavingPercent(id: PlanId): number {
  const plan = PLANS[id];
  if (!plan || plan.monthlyNpr === 0) return 0;
  const monthlyOverYear = plan.monthlyNpr * 12;
  return Math.round(((monthlyOverYear - plan.annualNpr) / monthlyOverYear) * 100);
}

/** Entitlements for a user with no active subscription. */
export const FREE_ENTITLEMENTS: Entitlements = PLANS.free.entitlements;

export function isPlanId(value: string): value is PlanId {
  return value === "free" || value === "business" || value === "enterprise";
}
