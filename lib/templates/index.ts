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
import {
  shareTransferDeed,
  boardResolution,
  articlesOfAssociation,
  foundersAgreement,
} from "./corporate";
import { rentTerminationNotice, salaryCertificate, experienceLetter } from "./notices";
import { landSaleDeed, giftDeed, rentReceipt } from "./property";
import { divorcePetition, adoptionDeed, affidavit, legalNotice } from "./family";
import {
  supplyAgreement,
  distributionAgreement,
  ipAssignment,
  consultancyRetainer,
  internshipAgreement,
  nonCompete,
} from "./agreements";

/**
 * Template registry.
 *
 * Templates are code rather than database rows so that a change to legal content
 * goes through review and version control. The database stores what a user answered,
 * never the clause text itself.
 *
 * Order within each category is roughly by how often the document is actually needed,
 * since the catalogue page renders them in this order.
 */
export const TEMPLATES: Template[] = [
  // Employment
  employmentContract,
  freelanceAgreement,
  internshipAgreement,
  nonCompete,
  salaryCertificate,
  experienceLetter,
  // Property
  residentialLease,
  rentTerminationNotice,
  rentReceipt,
  landSaleDeed,
  giftDeed,
  // Business
  memorandumOfAssociation,
  articlesOfAssociation,
  partnershipDeed,
  foundersAgreement,
  serviceAgreement,
  consultancyRetainer,
  supplyAgreement,
  distributionAgreement,
  saleOfGoods,
  ipAssignment,
  shareTransferDeed,
  boardResolution,
  loanAgreement,
  nda,
  // Family and personal
  powerOfAttorney,
  will,
  divorcePetition,
  adoptionDeed,
  affidavit,
  legalNotice,
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
      ne: "श्रम ऐन, २०७४ बमोजिम अनिवार्य लिखित करार तथा कर्मचारी प्रमाणपत्र।",
      en: "Contracts made mandatory by the Labour Act, 2074, and the certificates employees ask for.",
    },
  },
  {
    id: "property",
    label: { ne: "घरजग्गा", en: "Property" },
    blurb: {
      ne: "घरबहाल, राजीनामा, दान बकसपत्र र सम्बन्धित कागजात।",
      en: "Tenancy, sale deeds, gift deeds and the paperwork around them.",
    },
  },
  {
    id: "business",
    label: { ne: "व्यापार", en: "Business" },
    blurb: {
      ne: "कम्पनी दर्ता, साझेदारी, सञ्चालन व्यवस्था र व्यावसायिक करार।",
      en: "Incorporation, partnership, corporate governance and commercial contracts.",
    },
  },
  {
    id: "family",
    label: { ne: "पारिवारिक", en: "Family" },
    blurb: {
      ne: "अख्तियारनामा, इच्छापत्र, सम्बन्ध विच्छेद, स्वघोषणा र कानुनी सूचना।",
      en: "Powers of attorney, wills, divorce, affidavits and legal notices.",
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
  shareTransferDeed,
  boardResolution,
  articlesOfAssociation,
  foundersAgreement,
  rentTerminationNotice,
  salaryCertificate,
  experienceLetter,
  landSaleDeed,
  giftDeed,
  rentReceipt,
  divorcePetition,
  adoptionDeed,
  affidavit,
  legalNotice,
  supplyAgreement,
  distributionAgreement,
  ipAssignment,
  consultancyRetainer,
  internshipAgreement,
  nonCompete,
};
export { POST_REGISTRATION_CHAIN, OCR_FACTS } from "./moa";
