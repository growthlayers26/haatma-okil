import type {
  Template,
  Answers,
  Lang,
  Clause,
  Field,
  Condition,
  ValidationIssue,
  Citation,
} from "./types";
import { formatNpr, toNepaliDigits } from "./nepal";
import { parseBsString, formatBsLong } from "./bs-date";

/**
 * Document assembly.
 *
 * Clause selection is data, not template branching: answers map to clause conditions
 * and the renderer assembles whatever survives. Adding a document type means adding a
 * template object, never new rendering code.
 */

export type RenderedClause = {
  id: string;
  heading: string;
  body: string;
  citation?: Citation;
  locked: boolean;
};

export type RenderedDocument = {
  title: string;
  clauses: RenderedClause[];
};

const BLANK = "__________";

function fieldMap(template: Template): Map<string, Field> {
  const map = new Map<string, Field>();
  for (const step of template.steps) {
    for (const field of step.fields) map.set(field.id, field);
  }
  return map;
}

function isFilled(value: unknown): boolean {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

export function evaluate(condition: Condition | undefined, answers: Answers): boolean {
  if (!condition) return true;
  const raw = answers[condition.field];
  switch (condition.op) {
    case "truthy":
      return isFilled(raw) && Number(raw) !== 0;
    case "eq":
      return String(raw ?? "") === String(condition.value ?? "");
    case "neq":
      return String(raw ?? "") !== String(condition.value ?? "");
    case "gt":
      return Number(raw) > Number(condition.value);
    case "lt":
      return Number(raw) < Number(condition.value);
    default:
      return true;
  }
}

/**
 * Format a single answer for insertion into clause text. Formatting is driven by the
 * field's declared type, so currency lands as "रु. १,००,०००" in Nepali and
 * "NPR 1,00,000" in English, and BS dates render as long-form Devanagari.
 */
function formatAnswer(field: Field | undefined, value: unknown, lang: Lang): string {
  if (!isFilled(value)) return BLANK;
  const raw = String(value);

  if (!field) return raw;

  switch (field.type) {
    case "currency": {
      const n = Number(raw);
      if (Number.isNaN(n)) return raw;
      // The clause body already supplies the currency word, so emit digits only.
      return formatNpr(n, lang).replace(/^(रु\.|NPR)\s*/, "");
    }
    case "date-bs": {
      const bs = parseBsString(raw);
      return bs ? formatBsLong(bs, lang) : raw;
    }
    case "select": {
      const option = field.options?.find((o) => o.value === raw);
      return option ? option.label[lang] : raw;
    }
    case "number":
      return lang === "ne" ? toNepaliDigits(raw) : raw;
    default:
      return raw;
  }
}

function interpolate(
  body: string,
  answers: Answers,
  fields: Map<string, Field>,
  lang: Lang,
): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_match, key: string) =>
    formatAnswer(fields.get(key), answers[key], lang),
  );
}

export function renderDocument(
  template: Template,
  answers: Answers,
  lang: Lang,
): RenderedDocument {
  const fields = fieldMap(template);

  const clauses = template.clauses
    .filter((clause: Clause) => evaluate(clause.when, answers))
    .map((clause) => ({
      id: clause.id,
      heading: clause.heading[lang],
      body: interpolate(clause.body[lang], answers, fields, lang),
      citation: clause.citation,
      locked: clause.locked ?? false,
    }));

  return { title: template.title[lang], clauses };
}

/**
 * Statutory validation.
 *
 * Blocking issues stop generation outright. A platform operated by a Bar Council–
 * licensed firm cannot emit an instrument it knows to be unlawful, so these are not
 * dismissible warnings.
 */
export function validate(template: Template, answers: Answers): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const step of template.steps) {
    for (const field of step.fields) {
      const value = answers[field.id];

      if (field.required && !isFilled(value)) {
        // A missing required field is incompleteness, not illegality — it blocks
        // generation but carries the template's governing act rather than a specific one.
        issues.push({
          fieldId: field.id,
          blocking: true,
          kind: "missing",
          citation: field.citation ?? template.governingAct,
          message: {
            ne: `${field.label.ne} आवश्यक छ।`,
            en: `${field.label.en} is required.`,
          },
        });
        continue;
      }

      if (!isFilled(value) || !field.rules) continue;

      const numeric = Number(value);
      for (const rule of field.rules) {
        const breached =
          (rule.kind === "min" && rule.value !== undefined && numeric < rule.value) ||
          (rule.kind === "max" && rule.value !== undefined && numeric > rule.value);
        if (breached) {
          issues.push({
            fieldId: field.id,
            message: rule.message,
            citation: rule.citation,
            blocking: rule.blocking,
            kind: "statutory",
          });
        }
      }
    }
  }

  return issues;
}

export function hasBlockingIssues(issues: ValidationIssue[]): boolean {
  return issues.some((i) => i.blocking);
}

/** Fields on a given step, used to scope validation to the step in view. */
export function issuesForStep(
  template: Template,
  stepIndex: number,
  issues: ValidationIssue[],
): ValidationIssue[] {
  const ids = new Set(template.steps[stepIndex]?.fields.map((f) => f.id) ?? []);
  return issues.filter((i) => ids.has(i.fieldId));
}

export function completionPercent(template: Template, answers: Answers): number {
  const all = template.steps.flatMap((s) => s.fields);
  const required = all.filter((f) => f.required);
  if (required.length === 0) return 100;
  const done = required.filter((f) => isFilled(answers[f.id])).length;
  return Math.round((done / required.length) * 100);
}
