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
  /**
   * A numbered body paragraph, in layouts that number them.
   *
   * Court petitions number only the substantive paragraphs — the request and the
   * declaration — while the court address, the parties and the fee line run on
   * unnumbered above them. Contracts number every clause, so this is ignored there.
   */
  numbered?: boolean;
};

/**
 * How the finished document is laid out on the page.
 *
 * `instrument` is a private document between parties: a titled deed with numbered,
 * headed clauses and a signature block for each side. `petition` is a filing
 * addressed to a court, and its shape is prescribed by the court rather than chosen
 * — no title, no clause headings, one signatory, and the date at the foot rather
 * than the head. Rendering a petition as an instrument produces something a registry
 * would not accept, which is the whole reason this distinction exists.
 */
export type DocumentLayout = "instrument" | "petition";

/**
 * How an instrument's foot is signed. Ignored on `petition` layout, whose closing
 * is its own numbered clause rather than a generic block.
 *
 * The default — two named signature lines side by side — is right for an ordinary
 * bilateral contract and wrong for almost anything else. It was, for a while, the
 * only option every template got, which meant a will was rendered with a line for
 * a second signatory nobody expects to exist and no line for the two witnesses the
 * document itself requires; a salary certificate got a duplicate, contradictory
 * signature block bolted on beneath the one already written into its own body.
 * Each variant below exists because one real document in this catalogue needed it.
 */
export type SignatureSpec =
  /** Two named lines side by side — an ordinary bilateral contract. The default. */
  | { kind: "parties"; roles: [Bilingual, Bilingual] }
  /** One named line — a unilateral instrument with a single signatory: a grantor,
   * a testator, a declarant. */
  | { kind: "single"; role: Bilingual }
  /** One line per non-empty row of a multi-line answer, for however many people a
   * document actually names — a board's directors, a company's founders — rather
   * than a count fixed at two. */
  | { kind: "list"; fieldId: string; role: Bilingual }
  /** An instruction plus blank ruled space, for a signatory count no field
   * captures — "every founding shareholder must sign" said once, not guessed at. */
  | { kind: "note"; text: Bilingual }
  /** No footer at all: the clause content already ends with the sign-off — a
   * letter's letterhead-and-signature block, a notice's "From:" line. Appending
   * the generic footer on top would read as a second, contradictory signatory. */
  | { kind: "embedded" };

export type Category = "employment" | "property" | "business" | "family" | "litigation";

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
  /** Defaults to `instrument`. */
  layout?: DocumentLayout;
  /** Defaults to two generic party lines. See {@link SignatureSpec}. */
  signatures?: SignatureSpec;
  /**
   * Blank witness signature lines below the signature block — 2 is the number
   * every witnessed instrument in this catalogue actually asks for. Rendered only
   * when set; a document with no statutory witness requirement gets none.
   */
  witnessLines?: number;
  /** A notary attestation line below the signatures and any witnesses. */
  notarised?: boolean;
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
