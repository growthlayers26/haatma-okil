import { describe, it, expect } from "vitest";
import {
  AUDIENCES,
  getAudience,
  audiencesOf,
  matchesAudienceKeyword,
} from "@/lib/audiences";
import { getTemplate } from "@/lib/templates";
import { SERVICES, SERVICE_PATH } from "@/lib/services";

describe("audience shelves", () => {
  /*
   * A shelf names documents by slug, so a typo would drop a document from it without
   * anything failing — the page would just render one fewer row.
   */
  it("only lists documents and services that exist", () => {
    for (const audience of AUDIENCES) {
      for (const slug of audience.documents) {
        expect(getTemplate(slug), `${audience.id}: ${slug}`).toBeDefined();
      }
      for (const id of audience.services) {
        expect(SERVICES[id], `${audience.id}: ${id}`).toBeDefined();
        expect(SERVICE_PATH[id]).toMatch(/^\//);
      }
    }
  });

  it("lists nothing twice and never leaves a shelf empty", () => {
    for (const audience of AUDIENCES) {
      expect(audience.documents.length).toBeGreaterThan(0);
      expect(audience.services.length).toBeGreaterThan(0);
      expect(new Set(audience.documents).size).toBe(audience.documents.length);
      expect(new Set(audience.services).size).toBe(audience.services.length);
    }
  });

  it("puts one document on every shelf it suits", () => {
    expect(audiencesOf("founders-agreement")).toEqual(["startup"]);
    expect(audiencesOf("freelance-agreement")).toEqual(["tech", "solo"]);
    expect(audiencesOf("nda")).toEqual(["startup", "tech", "solo"]);
    expect(audiencesOf("residential-lease")).toEqual([]);
  });

  it("reads an audience from a URL parameter, and nothing else", () => {
    expect(getAudience("startup")?.id).toBe("startup");
    expect(getAudience("solo")?.id).toBe("solo");
    expect(getAudience("nonsense")).toBeNull();
    expect(getAudience("")).toBeNull();
    expect(getAudience(null)).toBeNull();
  });
});

describe("searching by who you are", () => {
  it("finds a shelf by the word someone would use for themselves", () => {
    expect(matchesAudienceKeyword("startup", "founders-agreement")).toBe(true);
    expect(matchesAudienceKeyword("Freelancer", "service-agreement")).toBe(true);
    expect(matchesAudienceKeyword("software", "non-compete")).toBe(true);
  });

  it("tolerates the plural and the longer word", () => {
    expect(matchesAudienceKeyword("startups", "company-moa")).toBe(true);
    expect(matchesAudienceKeyword("freelancing", "freelance-agreement")).toBe(true);
  });

  it("works in Nepali", () => {
    expect(matchesAudienceKeyword("स्टार्टअप", "founders-agreement")).toBe(true);
    expect(matchesAudienceKeyword("फ्रिल्यान्सर", "freelance-agreement")).toBe(true);
  });

  it("does not offer a document to an audience it is not on the shelf of", () => {
    expect(matchesAudienceKeyword("startup", "residential-lease")).toBe(false);
    expect(matchesAudienceKeyword("freelancer", "founders-agreement")).toBe(false);
  });

  it("ignores anything too short to mean something", () => {
    expect(matchesAudienceKeyword("so", "nda")).toBe(false);
    expect(matchesAudienceKeyword("  ", "nda")).toBe(false);
    expect(matchesAudienceKeyword("", "nda")).toBe(false);
  });
});
