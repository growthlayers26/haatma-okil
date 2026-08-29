"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLang } from "./language-provider";
import { DocumentPreview } from "./document-preview";
import { Checkout } from "./checkout";
import { getTemplate } from "@/lib/templates";
import { validate, issuesForStep, hasBlockingIssues } from "@/lib/render";
import { toNepaliDigits } from "@/lib/nepal";
import { usePersistentState } from "@/lib/use-persistent-state";
import type { Answers, Field, ValidationIssue } from "@/lib/types";

export const draftKey = (slug: string) => `mandala.draft.${slug}`;

// Module-level so the fallback identity is stable across renders.
const EMPTY_ANSWERS: Answers = {};

export function Wizard({ slug }: { slug: string }) {
  const { lang, t, bi } = useLang();
  const template = getTemplate(slug);

  /*
   * Drafts persist because wizard abandonment is the largest leak in the funnel,
   * and because Khalti and eSewa hand off to their own apps — wizard state has to
   * survive a full app switch. localStorage covers the client; Phase 2 moves this
   * server-side so a draft survives a device change too.
   */
  const [answers, setAnswers] = usePersistentState<Answers>(draftKey(slug), EMPTY_ANSWERS);

  const [stepIndex, setStepIndex] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  // Missing-field errors stay quiet until the user tries to leave the step, so an
  // untouched form doesn't open covered in red.
  const [revealErrors, setRevealErrors] = useState(false);

  const issues = useMemo(
    () => (template ? validate(template, answers) : []),
    [template, answers],
  );

  if (!template) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <h1 className="font-serif text-2xl font-semibold">
          {bi({ ne: "कागजात भेटिएन", en: "Document not found" })}
        </h1>
        <Link href="/templates" className="mt-4 inline-block text-accent underline">
          {bi({ ne: "सबै कागजात हेर्नुहोस्", en: "Browse all documents" })}
        </Link>
      </div>
    );
  }

  const totalSteps = template.steps.length;
  const isCheckout = stepIndex >= totalSteps;
  const step = template.steps[stepIndex];
  const stepIssues = isCheckout ? [] : issuesForStep(template, stepIndex, issues);
  const stepBlocked = hasBlockingIssues(stepIssues);

  const num = (n: number) => (lang === "ne" ? toNepaliDigits(n) : String(n));

  function setAnswer(id: string, value: string) {
    setAnswers({ ...answers, [id]: value });
  }

  function goTo(next: number) {
    setRevealErrors(false);
    setStepIndex(next);
  }

  function onContinue() {
    if (stepBlocked) {
      setRevealErrors(true);
      return;
    }
    goTo(stepIndex + 1);
  }

  if (isCheckout) {
    return (
      <Checkout
        template={template}
        answers={answers}
        onBack={() => setStepIndex(totalSteps - 1)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Progress */}
      <div className="no-print">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="font-serif text-3xl font-semibold tracking-[-0.02em]">
            {bi(template.title)}
          </h1>
          <span className="font-mono text-[0.7rem] uppercase tracking-wider text-ink-3">
            {t("saveDraft")} ✓
          </span>
        </div>

        {/*
          A named stepper rather than "Step 1 of 3 · 0%". A percentage says how much
          of a form is filled; the step names say what the document still wants to
          know, which is the question someone actually has. Completed steps stay
          reachable — people go back to check what they typed.
        */}
        <nav
          aria-label={t("stepOf")}
          className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-rule pt-4"
        >
          {template.steps.map((s, i) => {
            const done = i < stepIndex;
            const current = i === stepIndex;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => goTo(i)}
                disabled={i > stepIndex}
                aria-current={current ? "step" : undefined}
                className={`flex items-baseline gap-2 font-mono text-[0.72rem] uppercase tracking-[0.08em] transition-colors ${
                  current
                    ? "text-accent"
                    : done
                      ? "text-ink-2 hover:text-accent"
                      : "cursor-default text-ink-3/60"
                }`}
              >
                <span className="tabular-nums">{done ? "✓" : num(i + 1)}</span>
                {bi(s.title)}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        {/* Questions */}
        <div className="no-print">
          <h2 className="font-serif text-2xl font-semibold tracking-tight">{bi(step.title)}</h2>
          {step.intro && (
            <p className="mt-2 max-w-[56ch] leading-relaxed text-ink-2">{bi(step.intro)}</p>
          )}

          <div className="mt-8 space-y-7">
            {step.fields.map((field) => (
              <FieldInput
                key={field.id}
                field={field}
                value={answers[field.id]}
                onChange={(v) => setAnswer(field.id, v)}
                issues={stepIssues.filter((i) => i.fieldId === field.id)}
                reveal={revealErrors}
              />
            ))}
          </div>

          {stepBlocked && revealErrors && (
            <div className="mt-6 border-l-2 border-cinnabar bg-surface p-4">
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-cinnabar">
                {t("blockedTitle")}
              </p>
              <p className="mt-1.5 text-sm text-ink-2">{t("blockedBody")}</p>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => goTo(Math.max(0, stepIndex - 1))}
              disabled={stepIndex === 0}
              className="border border-rule-strong px-4 py-2 text-sm text-ink-2 transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← {t("back")}
            </button>

            {/*
              Enabled even when the step is incomplete: pressing it reveals what is
              missing, which tells the user more than a dead button does.
            */}
            <button
              type="button"
              onClick={onContinue}
              className="bg-accent px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {stepIndex === totalSteps - 1 ? t("reviewAndPay") : t("continue")} →
            </button>
          </div>

          {/* On small screens the preview becomes a pull-up sheet rather than a second column. */}
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="mt-6 w-full border border-rule-strong px-4 py-2.5 font-mono text-xs text-accent lg:hidden"
          >
            {showPreview ? "▾" : "▸"} {t("livePreview")}
          </button>
        </div>

        {/* Live preview + rationale */}
        <div className={`${showPreview ? "block" : "hidden"} space-y-4 lg:block`}>
          <div className="border border-rule">
            <div className="no-print flex items-center justify-between border-b border-rule bg-surface-2 px-3 py-2">
              <span className="font-mono text-xs uppercase tracking-wider text-ink-3">
                {t("livePreview")}
              </span>
            </div>
            <div className="max-h-[32rem] overflow-y-auto">
              <DocumentPreview template={template} answers={answers} mode="preview" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  issues,
  reveal,
}: {
  field: Field;
  value: string | number | undefined;
  onChange: (value: string) => void;
  issues: ValidationIssue[];
  reveal: boolean;
}) {
  const { bi, lang } = useLang();
  const [touched, setTouched] = useState(false);

  // A statutory breach shows the moment it is entered — the figure itself is unlawful.
  // A missing answer waits until the field is blurred or the user tries to continue.
  const visible = issues.filter((i) => i.kind === "statutory" || touched || reveal);
  const blocking = visible.find((i) => i.blocking);
  const warning = visible.find((i) => !i.blocking);

  const borderClass = blocking
    ? "border-cinnabar"
    : warning
      ? "border-orpiment"
      : "border-rule-strong focus:border-accent";

  const base = `w-full border bg-surface px-3 py-2.5 text-base outline-none transition-colors ${borderClass}`;
  const id = `field-${field.id}`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold">
        {bi(field.label)}
        {field.required && (
          <span aria-hidden className="ml-1 text-cinnabar">
            *
          </span>
        )}
      </label>

      <div className="mt-1.5">
        {field.type === "textarea" ? (
          <textarea
            id={id}
            rows={2}
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder={field.placeholder ? bi(field.placeholder) : undefined}
            className={base}
          />
        ) : field.type === "select" ? (
          <select
            id={id}
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setTouched(true)}
            className={base}
          >
            <option value="">—</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {bi(option.label)}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={id}
            type={field.type === "number" || field.type === "currency" ? "number" : "text"}
            inputMode={field.type === "number" || field.type === "currency" ? "numeric" : undefined}
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder={field.placeholder ? bi(field.placeholder) : undefined}
            className={base}
          />
        )}
      </div>

      {/*
        The explanation sits with its field rather than in a side panel.
        This is the layer that justifies paying for a document a friend could
        forward — putting it in the far column on desktop and behind a collapsed
        toggle on mobile was hiding the reason to buy.
      */}
      {field.help && !blocking && (
        <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-ink-3">{bi(field.help)}</p>
      )}

      {field.citation && (
        <p className="mt-1.5 font-mono text-[0.7rem] leading-tight text-ink-3">
          → {field.citation.act[lang]} {field.citation.section[lang]}
        </p>
      )}

      {(blocking ?? warning) && (
        <p
          className={`mt-1.5 text-sm ${blocking ? "text-cinnabar" : "text-orpiment"}`}
          role={blocking ? "alert" : undefined}
        >
          {bi((blocking ?? warning)!.message)}
          <span className="ml-1.5 font-mono text-[0.7rem] text-ink-3">
            {(blocking ?? warning)!.citation.act[lang]} {(blocking ?? warning)!.citation.section[lang]}
          </span>
        </p>
      )}
    </div>
  );
}
