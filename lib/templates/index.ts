import type { Template, Category, Bilingual } from "../types";
import { employmentContract } from "./employment";
import { residentialLease } from "./lease";
import { nda } from "./nda";
import { loanAgreement } from "./loan";
import { memorandumOfAssociation } from "./moa";

/**
 * Template registry.
 *
 * Templates are code rather than database rows so that a change to legal content
 * goes through review and version control. The database stores what a user answered,
 * never the clause text itself.
 */
export const TEMPLATES: Template[] = [
  employmentContract,
  residentialLease,
  loanAgreement,
  nda,
  memorandumOfAssociation,
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
      ne: "व्यावसायिक करार, गोपनीयता र ऋण सम्झौता।",
      en: "Commercial contracts, confidentiality and lending.",
    },
  },
  {
    id: "family",
    label: { ne: "पारिवारिक", en: "Family" },
    blurb: {
      ne: "अंशबन्डा, इच्छापत्र र पारिवारिक कागजात — तयारीमा।",
      en: "Partition, wills and family documents — in preparation.",
    },
  },
];

export { employmentContract, residentialLease, nda, loanAgreement, memorandumOfAssociation };
export { POST_REGISTRATION_CHAIN, OCR_FACTS } from "./moa";
