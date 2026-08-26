import { z } from "zod";
import type { Template, Clause, Answers } from "./types";
import { getTemplate } from "./templates";

/**
 * Organisation template overlays.
 *
 * An overlay is not a document. It is a set of additions to a template that already
 * exists in the reviewed code registry: preset answers, plus clauses of the
 * organisation's own.
 *
 * Everything below exists to keep one invariant true — an organisation can add to a
 * template but can never weaken it. Legal content lives in reviewed code so that an
 * amendment is a single audited edit; if a customer could paste arbitrary clause
 * text into the database, statutory clauses would drift out of review and the
 * validation in lib/render.ts would have nothing left to validate against.
 */

/*
 * The clause shape an organisation may contribute.
 *
 * Two fields from Clause are deliberately absent:
 *
 *   `locked`  — locked means "fixed by statute, cannot be reduced". Only the firm's
 *               reviewed templates get to make that claim about the law.
 *   `citation`— a citation asserts statutory authority. An organisation asserting
 *               one would put the firm's name behind a reference no advocate saw.
 *
 * An overlay clause is therefore always an ordinary, unlocked, uncited term.
 */
const OverlayClauseSchema = z.object({
  id: z.string().trim().min(1).max(60),
  heading: z.object({ ne: z.string().min(1), en: z.string().min(1) }),
  body: z.object({ ne: z.string().min(1), en: z.string().min(1) }),
});

export const OverlaySchema = z.object({
  baseSlug: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  defaultAnswers: z.record(z.string(), z.union([z.string(), z.number()])).default({}),
  extraClauses: z.array(OverlayClauseSchema).max(20).default([]),
});

export type Overlay = z.infer<typeof OverlaySchema>;
export type OverlayClause = z.infer<typeof OverlayClauseSchema>;

export type OverlayProblem =
  | { code: "unknown_base"; detail: string }
  | { code: "duplicate_clause_id"; detail: string }
  | { code: "unknown_answer_field"; detail: string };

/**
 * Checks an overlay against the base template before it is stored.
 *
 * Rejecting a clause id that collides with a base clause matters more than it looks:
 * a collision would let an organisation shadow a statutory clause by reusing its id,
 * which is the exact weakening this design exists to prevent.
 */
export function validateOverlay(overlay: Overlay): OverlayProblem[] {
  const base = getTemplate(overlay.baseSlug);
  if (!base) return [{ code: "unknown_base", detail: overlay.baseSlug }];

  const problems: OverlayProblem[] = [];

  const baseIds = new Set(base.clauses.map((c) => c.id));
  const seen = new Set<string>();
  for (const clause of overlay.extraClauses) {
    if (baseIds.has(clause.id) || seen.has(clause.id)) {
      problems.push({ code: "duplicate_clause_id", detail: clause.id });
    }
    seen.add(clause.id);
  }

  // Presetting a field the template does not have would silently do nothing.
  const fieldIds = new Set(base.steps.flatMap((s) => s.fields.map((f) => f.id)));
  for (const key of Object.keys(overlay.defaultAnswers)) {
    if (!fieldIds.has(key)) problems.push({ code: "unknown_answer_field", detail: key });
  }

  return problems;
}

/**
 * Produces the template an organisation's members actually fill in.
 *
 * The base is spread first and its clauses come first, so overlay clauses are strictly
 * additive and land after everything the firm reviewed. `review` and `execution` are
 * inherited untouched — the advocate sign-off and the execution requirements belong
 * to the base document and an organisation cannot alter either.
 */
export function applyOverlay(overlay: Overlay): Template | null {
  const base = getTemplate(overlay.baseSlug);
  if (!base) return null;
  if (validateOverlay(overlay).length > 0) return null;

  const extra: Clause[] = overlay.extraClauses.map((c) => ({
    id: c.id,
    heading: c.heading,
    body: c.body,
    // Never locked, never cited — see the note on OverlayClauseSchema.
  }));

  return {
    ...base,
    // Namespaced so an overlay can never be mistaken for, or routed to, the base.
    slug: `org:${overlay.baseSlug}:${overlay.name}`,
    title: { ne: overlay.name, en: overlay.name },
    clauses: [...base.clauses, ...extra],
  };
}

/**
 * Starting answers for a document begun from an overlay.
 *
 * Defaults are applied underneath anything the user has already entered, so opening
 * an overlay never overwrites work in progress.
 */
export function seedAnswers(overlay: Overlay, existing: Answers = {}): Answers {
  return { ...overlay.defaultAnswers, ...existing };
}
