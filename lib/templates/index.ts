import type { Template, Category, Bilingual } from "../types";
import { employmentContract } from "./employment";
import { residentialLease } from "./lease";
import { nda } from "./nda";
import { loanAgreement } from "./loan";
import { memorandumOfAssociation } from "./moa";
import {
  partnershipDeed,
  serviceAgreement,
  saleOfGoods,
  freelanceAgreement,
} from "./commercial";
import { powerOfAttorney, will } from "./personal";

/**
 * Template registry.
 *
 * Templates are code rather than database rows so that a change to legal content
 * goes through review and version control. The database stores what a user answered,
 * never the clause text itself.
 */
export const TEMPLATES: Template[] = [
  // Employment
  employmentContract,
  freelanceAgreement,
  // Property
  residentialLease,
  // Business
  memorandumOfAssociation,
  partnershipDeed,
  serviceAgreement,
  saleOfGoods,
  loanAgreement,
  nda,
  // Family and personal
  powerOfAttorney,
  will,
];

export function getTemplate(slug: string): Template | undefined {
  return TEMPLATES.find((t) => t.slug === slug);
}

export function templatesByCategory(category: Category): Template[] {
  return TEMPLATES.filter((t) => t.category === category);
}

export const CATEGORIES: { id: Category; label: Bilingual; blurb: Bilingual }[] = [
  {
    id: "employment",
    label: { ne: "रोजगारी", en: "Employment" },
    blurb: {
      ne: "श्रम ऐन, २०७४ बमोजिम अनिवार्य लिखित करार।",
      en: "Written contracts made mandatory by the Labour Act, 2074.",
    },
  },
  {
    id: "property",
    label: { ne: "घरजग्गा", en: "Property" },
    blurb: {
      ne: "घरबहाल तथा सम्पत्ति सम्बन्धी सम्झौता।",
      en: "Tenancy and property agreements.",
    },
  },
  {
    id: "business",
    label: { ne: "व्यापार", en: "Business" },
    blurb: {
      ne: "कम्पनी दर्ता, साझेदारी, व्यावसायिक करार र ऋण सम्झौता।",
      en: "Incorporation, partnership, commercial contracts and lending.",
    },
  },
  {
    id: "family",
    label: { ne: "पारिवारिक", en: "Family" },
    blurb: {
      ne: "अख्तियारनामा, इच्छापत्र र पारिवारिक कागजात।",
      en: "Powers of attorney, wills and family documents.",
    },
  },
];

export {
  employmentContract,
  residentialLease,
  nda,
  loanAgreement,
  memorandumOfAssociation,
  partnershipDeed,
  serviceAgreement,
  saleOfGoods,
  freelanceAgreement,
  powerOfAttorney,
  will,
};
export { POST_REGISTRATION_CHAIN, OCR_FACTS } from "./moa";
