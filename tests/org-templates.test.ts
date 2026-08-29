import { describe, it, expect } from "vitest";
import { OverlaySchema, validateOverlay, applyOverlay, seedAnswers } from "@/lib/org-templates";
import { getTemplate } from "@/lib/templates";

const BASE = "employment-contract";
const base = getTemplate(BASE)!;
const lockedIds = base.clauses.filter((c) => c.locked).map((c) => c.id);

describe("organisation overlays", () => {
  it("refuses to shadow a statutory clause", () => {
    /*
     * The attack this whole design exists to stop: reusing a locked clause's id to
     * replace it with terms that disapply the statute.
     */
    const shadow = OverlaySchema.parse({
      baseSlug: BASE,
      name: "Acme standard",
      extraClauses: [
        {
          id: lockedIds[0],
          heading: { ne: "बदलिएको", en: "Overridden" },
          body: { ne: "लागू हुँदैन।", en: "The minimum wage does not apply." },
        },
      ],
    });

    expect(validateOverlay(shadow)).toContainEqual({
      code: "duplicate_clause_id",
      detail: lockedIds[0],
    });
    expect(applyOverlay(shadow)).toBeNull();
  });

  it("appends an ordinary clause without touching the base", () => {
    const overlay = OverlaySchema.parse({
      baseSlug: BASE,
      name: "Acme standard",
      extraClauses: [
        {
          id: "org-laptop",
          heading: { ne: "ल्यापटप", en: "Company laptop" },
          body: { ne: "कम्पनीले दिनेछ।", en: "The company provides a laptop." },
        },
      ],
    });

    const merged = applyOverlay(overlay)!;
    expect(merged.clauses).toHaveLength(base.clauses.length + 1);
    expect(merged.clauses.at(-1)!.id).toBe("org-laptop");

    // Every locked clause survives, still locked.
    for (const id of lockedIds) {
      expect(merged.clauses.find((c) => c.id === id)?.locked).toBe(true);
    }

    // An organisation cannot claim statutory authority for its own term.
    const added = merged.clauses.find((c) => c.id === "org-laptop")!;
    expect(added.locked).toBeUndefined();
    expect(added.citation).toBeUndefined();

    // Advocate review and execution requirements belong to the base.
    expect(merged.review).toEqual(base.review);
    expect(merged.execution).toEqual(base.execution);
  });

  it("rejects a base that is not in the registry", () => {
    const overlay = OverlaySchema.parse({ baseSlug: "invented", name: "x" });
    expect(validateOverlay(overlay)).toContainEqual({ code: "unknown_base", detail: "invented" });
  });

  it("rejects a default for a field the base does not have", () => {
    const overlay = OverlaySchema.parse({
      baseSlug: BASE,
      name: "x",
      defaultAnswers: { notAField: "1" },
    });
    expect(validateOverlay(overlay)).toContainEqual({
      code: "unknown_answer_field",
      detail: "notAField",
    });
  });

  it("never overwrites work already in progress", () => {
    const overlay = OverlaySchema.parse({
      baseSlug: BASE,
      name: "x",
      defaultAnswers: { employerName: "Acme Pvt Ltd" },
    });
    expect(seedAnswers(overlay, { employerName: "Typed by the user" })).toEqual({
      employerName: "Typed by the user",
    });
  });
});
