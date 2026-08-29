"use client";

import { useLang } from "./language-provider";
import { renderDocument } from "@/lib/render";
import { formatBsLong, todayBs } from "@/lib/bs-date";
import type { Template, Answers } from "@/lib/types";

/**
 * Renders the assembled document.
 *
 * The whole document is readable before payment — the watermark is the gate, not a
 * truncation. A buyer who has read the entire instrument converts better than one
 * paying to find out what they are getting, and a half-hidden document reads as a
 * broken page rather than a paywall.
 */
export function DocumentPreview({
  template,
  answers,
  mode = "preview",
}: {
  template: Template;
  answers: Answers;
  mode?: "preview" | "full";
}) {
  const { lang, t, bi } = useLang();
  const doc = renderDocument(template, answers, lang);
  const today = todayBs();

  // Repeat the mark down the page so every screenful carries it, the way a stamped
  // draft does — a single centred word leaves most pages unmarked.
  const watermarkRepeats = Math.max(2, Math.ceil(doc.clauses.length / 2));

  return (
    <article className="print-document relative bg-surface" lang={lang}>
      {mode === "preview" && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-around overflow-hidden"
        >
          {Array.from({ length: watermarkRepeats }, (_, i) => (
            <span
              key={i}
              className="rotate-[-24deg] text-center font-serif text-5xl font-semibold uppercase tracking-widest text-ink opacity-[0.055]"
            >
              {t("previewWatermark")}
            </span>
          ))}
        </div>
      )}

      <div className="px-6 py-8 sm:px-10 sm:py-10">
        <header className="border-b border-rule pb-7 text-center">
          <h1 className="font-serif text-3xl font-semibold leading-tight tracking-[-0.015em] sm:text-[2.1rem]">
            {doc.title}
          </h1>
          <p className="mt-3 font-mono text-[0.7rem] uppercase tracking-[0.1em] text-ink-3">
            {bi({ ne: "मिति", en: "Date" })}: {formatBsLong(today, lang)}
          </p>
        </header>

        <div className="mt-8 space-y-8">
          {doc.clauses.map((clause, index) => (
            <section key={clause.id}>
              <h2 className="flex flex-wrap items-baseline gap-x-2 font-serif text-lg font-semibold tracking-tight">
                <span className="font-mono text-xs text-accent">{index + 1}.</span>
                {clause.heading}
                {clause.locked && (
                  <span className="font-mono text-[0.65rem] font-normal uppercase tracking-wider text-malachite">
                    {t("statutoryLocked")}
                  </span>
                )}
              </h2>

              <p className="mt-2.5 max-w-[68ch] whitespace-pre-line text-[1.0625rem] leading-[1.75] text-ink-2">
                {clause.body}
              </p>

              {clause.citation && (
                <p className="mt-2 font-mono text-[0.7rem] leading-relaxed text-ink-3">
                  → {clause.citation.act[lang]} {clause.citation.section[lang]}
                </p>
              )}
            </section>
          ))}
        </div>

        {/* The signature block belongs in the document, not in the UI chrome around it. */}
        <div className="mt-10 grid gap-8 border-t border-rule pt-8 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i}>
              <div className="h-10 border-b border-ink-3" />
              <p className="mt-1.5 font-mono text-[0.7rem] text-ink-3">
                {bi({ ne: "हस्ताक्षर र मिति", en: "Signature and date" })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
