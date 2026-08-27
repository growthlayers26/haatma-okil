export type Lang = "ne" | "en";

/** Every user-facing string carries both scripts. Nepali is authoritative for execution. */
export type Bilingual = { ne: string; en: string };

/**
 * A pointer to the provision a clause or question derives from. Structured rather
 * than prose so an amendment becomes a query: "which templates cite Labour Act §11".
 */
export type Citation = {
  act: Bilingual;
  /** Section reference, e.g. { ne: "दफा ११", en: "§11" }. */
  section: Bilingual;
  url?: string;
};

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "date-bs"
  | "select";

export type Option = { value: string; label: Bilingual };

/**
 * A statutory floor or ceiling. `blocking` refusals stop generation outright —
 * a firm operating under a Bar Council licence cannot emit a knowingly unlawful
 * instrument, so these are not warnings the user can dismiss.
 */
export type Rule = {
  kind: "min" | "max" | "required";
  value?: number;
  message: Bilingual;
  citation: Citation;
  blocking: boolean;
};

export type Field = {
  id: string;
  label: Bilingual;
  placeholder?: Bilingual;
  /** Shown in the "why this is asked" panel beside the question. */
  help?: Bilingual;
  type: FieldType;
  options?: Option[];
  required?: boolean;
  rules?: Rule[];
  citation?: Citation;
};

export type Condition = {
  field: string;
  op: "eq" | "neq" | "gt" | "lt" | "truthy";
  value?: string | number;
};

export type Step = {
  id: string;
  title: Bilingual;
  /** Legal concept this step covers, shown under the title. */
  intro?: Bilingual;
  fields: Field[];
};

/**
 * Clause bodies interpolate `{{fieldId}}`. Locked clauses are statutory and are
 * rendered whether or not the user wants them.
 */
export type Clause = {
  id: string;
  heading: Bilingual;
  body: Bilingual;
  citation?: Citation;
  when?: Condition;
  locked?: boolean;
};

export type Category = "employment" | "property" | "business" | "family";

export type AdvocateReview = {
  name: Bilingual;
  /** Nepal Bar Council licence number. Placeholder until the firm supplies real values. */
  /** Null until an advocate signs the template off. Never shown as a placeholder. */
  nbcLicence: string | null;
  /** Bikram Sambat, YYYY-MM-DD. */
  reviewedOnBs: string;
  nextReviewBs: string;
};

export type Template = {
  slug: string;
  title: Bilingual;
  summary: Bilingual;
  category: Category;
  priceNpr: number;
  governingAct: Citation;
  review: AdvocateReview;
  /**
   * What remains to be done for the instrument to be valid — stamping, notarisation,
   * witnesses. Surfaced before payment so nobody mistakes a download for execution.
   */
  execution: Bilingual[];
  steps: Step[];
  clauses: Clause[];
};

export type Answers = Record<string, string | number | undefined>;

export type ValidationIssue = {
  fieldId: string;
  message: Bilingual;
  citation: Citation;
  blocking: boolean;
  /**
   * `missing` is an incomplete answer — surfaced once the user has engaged with the
   * field. `statutory` is a value that conflicts with law — surfaced immediately,
   * because the user needs to know the figure itself is unlawful.
   */
  kind: "missing" | "statutory";
};
