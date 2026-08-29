"use client";

import type { ReactNode } from "react";

/**
 * The shared visual system.
 *
 * Every page had been hand-rolling its own heading sizes, label treatments and
 * callout boxes. Twelve copies of `font-serif text-3xl` drift the moment one of them
 * is edited, and the drift shows up as a product that feels assembled rather than
 * designed. These are the decisions, made once.
 *
 * The scale is deliberately narrow. A legal product wants a small number of
 * confident sizes, not a continuum — the restraint is what reads as authority.
 */

/* ------------------------------------------------------------------ headings */

/**
 * The top of a page.
 *
 * `lead` is set at reading size rather than as a subtitle: on most of these pages it
 * carries the one sentence that decides whether someone continues.
 */
export function PageHeader({
  title,
  lead,
  aside,
}: {
  title: ReactNode;
  lead?: ReactNode;
  /** Right-aligned companion — a price, a status, a count. */
  aside?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
      <div className="min-w-0">
        <h1 className="font-serif text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
          {title}
        </h1>
        {lead && (
          <p className="mt-4 max-w-[62ch] text-lg leading-relaxed text-ink-2">{lead}</p>
        )}
      </div>
      {aside && <div className="flex-none">{aside}</div>}
    </header>
  );
}

/** A heading inside a page. One step down from PageHeader, still serif. */
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-serif text-2xl font-semibold tracking-tight">{children}</h2>
  );
}

/**
 * The small mono label that names a block.
 *
 * Set in mono rather than sans so it reads as apparatus around the content instead
 * of competing with it — the same reason the navigation is mono.
 */
export function SectionLabel({
  children,
  as: Tag = "h2",
}: {
  children: ReactNode;
  as?: "h2" | "h3" | "p";
}) {
  return (
    <Tag className="font-mono text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-ink-3">
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ callouts */

/**
 * Tones carry meaning consistently across the product, so a reader learns them once:
 *
 *   note      neutral context
 *   accent    something the firm is offering or asking for
 *   caution   a limit, a cost, or something easy to get wrong
 *   danger    a refusal, a conflict, or a legal consequence
 *   good      a confirmation
 */
export type Tone = "note" | "accent" | "caution" | "danger" | "good";

const TONE_BORDER: Record<Tone, string> = {
  note: "border-rule-strong",
  accent: "border-accent",
  caution: "border-orpiment",
  danger: "border-cinnabar",
  good: "border-malachite",
};

const TONE_TEXT: Record<Tone, string> = {
  note: "text-ink-3",
  accent: "text-accent",
  caution: "text-orpiment",
  danger: "text-cinnabar",
  good: "text-malachite",
};

export function Callout({
  tone = "note",
  label,
  children,
  className = "",
}: {
  tone?: Tone;
  label?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`border-l-2 ${TONE_BORDER[tone]} bg-surface p-5 ${className}`}>
      {label && (
        <p
          className={`font-mono text-[0.7rem] font-semibold uppercase tracking-wider ${TONE_TEXT[tone]}`}
        >
          {label}
        </p>
      )}
      <div className={`max-w-[62ch] text-sm leading-relaxed text-ink-2 ${label ? "mt-2" : ""}`}>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ figures */

/**
 * A number and what it counts.
 *
 * Tabular numerals on purpose: figures that align down a column read as a record,
 * and a record is more persuasive than a claim.
 */
export function Figure({ value, label }: { value: ReactNode; label: ReactNode }) {
  return (
    <div>
      <p className="font-serif text-4xl font-semibold tabular-nums tracking-tight">{value}</p>
      <p className="mt-1.5 max-w-[18ch] font-mono text-[0.7rem] uppercase leading-relaxed tracking-wider text-ink-3">
        {label}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ structure */

/** Hairline-separated stack — the index treatment used across listing surfaces. */
export function Rows({ children }: { children: ReactNode }) {
  return <div className="grid gap-px border border-rule bg-rule">{children}</div>;
}

/** The empty state for any listing. Dashed, quiet, never an error. */
export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="border border-dashed border-rule-strong p-6 text-sm text-ink-2">{children}</p>
  );
}

/* ------------------------------------------------------------------ actions */

type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
};

/**
 * The one loud control on a page.
 *
 * Accent is reserved for this. Filling large surfaces with it — as the old search
 * slab did — spends the colour on things that are not the decision.
 */
export function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled,
  className = "",
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`bg-accent px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export function QuietButton({
  children,
  onClick,
  type = "button",
  disabled,
  className = "",
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`border border-rule-strong px-4 py-2.5 text-sm text-ink-2 transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ fields */

/** Label + control, with the underline treatment used since the homepage search. */
export function Field({
  id,
  label,
  hint,
  children,
}: {
  id?: string;
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {hint && <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-ink-3">{hint}</p>}
    </div>
  );
}

/** Shared input styling so every form on the product agrees. */
export const inputClass =
  "w-full border border-rule-strong bg-surface px-3 py-2.5 text-base outline-none transition-colors focus:border-accent";
