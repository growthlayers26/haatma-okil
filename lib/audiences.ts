import type { Bilingual } from "./types";
import type { ServiceId } from "./services";

/**
 * Who a document or service is for.
 *
 * A second way into the same catalogue, not a second catalogue. The documents and
 * services listed here are the ones that already exist; an audience is just an ordered
 * shelf over them, and one document can sit on several shelves. Keeping it as a
 * registry beside the templates, rather than a field on each of them, means adding a
 * shelf never touches legal content, which goes through review.
 *
 * Order is the order someone at that stage needs things, since the browse page renders
 * it as written.
 */

export type AudienceId = "startup" | "tech" | "solo";

export type Audience = {
  id: AudienceId;
  label: Bilingual;
  blurb: Bilingual;
  /**
   * Words a person might type to describe themselves, in either script. They let a
   * search for "startup" or "freelancer" land on this shelf even though no document's
   * own title or summary uses the word.
   */
  keywords: string[];
  /** Template slugs, in the order they are needed. */
  documents: string[];
  /** Services that belong beside those documents. */
  services: ServiceId[];
};

export const AUDIENCES: Audience[] = [
  {
    id: "startup",
    label: { ne: "स्टार्टअप", en: "Startups" },
    blurb: {
      ne: "सह-संस्थापकबीचको सम्झौता, कम्पनी दर्ताका कागजात, र शेयर तथा बौद्धिक सम्पत्तिको स्पष्टता।",
      en: "Terms between co-founders, the papers to incorporate, and clarity on equity and who owns what is built.",
    },
    keywords: ["startup", "start-up", "founder", "cofounder", "co-founder", "स्टार्टअप", "संस्थापक"],
    documents: [
      "founders-agreement",
      "company-moa",
      "articles-of-association",
      "ip-assignment",
      "nda",
      "board-resolution",
      "share-transfer-deed",
      "employment-contract",
      "internship-agreement",
    ],
    services: ["company_registration", "trademark", "tax_registration"],
  },
  {
    id: "tech",
    label: { ne: "प्रविधि व्यवसाय", en: "Tech businesses" },
    blurb: {
      ne: "ग्राहकसँगका सेवा सम्झौता, कर्मचारी तथा इन्टर्न नियुक्ति, र कोड तथा गोप्य जानकारीको संरक्षण।",
      en: "Client service contracts, hiring staff and interns, and protecting your code and confidential information.",
    },
    keywords: ["tech", "software", "saas", "developer", "digital", "प्रविधि", "सफ्टवेयर"],
    documents: [
      "service-agreement",
      "nda",
      "ip-assignment",
      "employment-contract",
      "internship-agreement",
      "consultancy-retainer",
      "freelance-agreement",
      "non-compete",
    ],
    services: ["document_review", "tax_registration", "trademark"],
  },
  {
    id: "solo",
    label: { ne: "एकल उद्यमी तथा फ्रिल्यान्सर", en: "Solo founders and freelancers" },
    blurb: {
      ne: "ग्राहकसँगको कामलाई सम्झौतामा बाँध्ने कागजात, र बढ्दै जाँदा चाहिने PAN तथा दर्ता।",
      en: "Contracts that put client work in writing, and the PAN and registration you will need as you grow.",
    },
    keywords: [
      "solo",
      "solopreneur",
      // A stem, so "freelance", "freelancer" and "freelancing" all land here.
      "freelanc",
      "self-employed",
      "consultant",
      "एकल",
      "फ्रिल्यान्सर",
      "स्वरोजगार",
    ],
    documents: [
      "freelance-agreement",
      "service-agreement",
      "nda",
      "consultancy-retainer",
      "ip-assignment",
    ],
    services: ["tax_registration", "company_registration", "question"],
  },
];

/** The audience a URL parameter names, or null for anything else. */
export function getAudience(id: string | null | undefined): Audience | null {
  return AUDIENCES.find((a) => a.id === id) ?? null;
}

/** Every audience a document is on the shelf of. */
export function audiencesOf(slug: string): AudienceId[] {
  return AUDIENCES.filter((a) => a.documents.includes(slug)).map((a) => a.id);
}

/**
 * Whether a search for `query` is a way of describing someone who would want this
 * document, as opposed to a word in the document itself.
 *
 * Three characters at least, and either side may contain the other, so "startups" and
 * "freelancing" still find their shelf. Anything shorter would match half the alphabet.
 */
export function matchesAudienceKeyword(query: string, slug: string): boolean {
  const needle = query.trim().toLowerCase();
  if (needle.length < 3) return false;

  return AUDIENCES.some(
    (a) =>
      a.documents.includes(slug) &&
      a.keywords.some((k) => k.includes(needle) || needle.includes(k)),
  );
}
