"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLang } from "@/components/language-provider";
import { TEMPLATES, CATEGORIES } from "@/lib/templates";
import { formatNpr, toNepaliDigits } from "@/lib/nepal";
import { parseBsString, formatBsShort } from "@/lib/bs-date";
import type { Category } from "@/lib/types";

function TemplateLibrary() {
  const { t, bi, lang } = useLang();
  const params = useSearchParams();

  const initialCategory = (params.get("category") as Category | null) ?? null;
  const [category, setCategory] = useState<Category | null>(initialCategory);
  const [query, setQuery] = useState(params.get("q") ?? "");

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return TEMPLATES.filter((tpl) => {
      if (category && tpl.category !== category) return false;
      if (!needle) return true;
      // Search both scripts, so "करार" and "contract" both find the same document.
      return (
        tpl.title.en.toLowerCase().includes(needle) ||
        tpl.title.ne.includes(query.trim()) ||
        tpl.summary.en.toLowerCase().includes(needle) ||
        tpl.summary.ne.includes(query.trim())
      );
    });
  }, [category, query]);

  const priceLabel = (npr: number) => formatNpr(npr, lang);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold tracking-tight">{t("allDocuments")}</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[15rem_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("search")}
            className="w-full border border-rule-strong bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
          />

          <h2 className="mt-6 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-ink-3">
            {t("popularCategories")}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2 lg:flex-col lg:items-start">
            <button
              type="button"
              onClick={() => setCategory(null)}
              className={`border px-3 py-1.5 text-sm transition-colors ${
                category === null
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-rule-strong text-ink-2 hover:border-accent hover:text-accent"
              }`}
            >
              {t("allDocuments")}
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`border px-3 py-1.5 text-sm transition-colors ${
                  category === cat.id
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-rule-strong text-ink-2 hover:border-accent hover:text-accent"
                }`}
              >
                {bi(cat.label)}
              </button>
            ))}
          </div>
        </aside>

        <div>
          <p className="font-mono text-xs text-ink-3">
            {lang === "ne" ? toNepaliDigits(results.length) : results.length} {t("documentsCount")}
          </p>

          <div className="mt-3 grid gap-px border border-rule bg-rule sm:grid-cols-2">
            {results.map((tpl) => {
              const reviewed = parseBsString(tpl.review.reviewedOnBs);
              return (
                <Link
                  key={tpl.slug}
                  href={`/create/${tpl.slug}`}
                  className="group flex flex-col gap-3 bg-surface p-5 transition-colors hover:bg-accent-soft"
                >
                  <div>
                    <h3 className="font-serif text-lg font-semibold tracking-tight group-hover:text-accent">
                      {bi(tpl.title)}
                    </h3>
                    <p className="mt-1.5 text-sm text-ink-2">{bi(tpl.summary)}</p>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-rule-strong pt-3">
                    <span className="font-mono text-xs text-ink-3">
                      {bi(tpl.governingAct.act)} {bi(tpl.governingAct.section)}
                    </span>
                    <span className="font-serif text-base font-semibold tabular-nums">
                      {priceLabel(tpl.priceNpr)}
                    </span>
                  </div>

                  {/* The review date is the credibility signal a free template cannot show. */}
                  {reviewed && (
                    <p className="font-mono text-[0.7rem] text-malachite">
                      ✓ {t("reviewedOn")} {formatBsShort(reviewed, lang)}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>

          {results.length === 0 && (
            <p className="mt-8 text-ink-2">
              {bi({
                ne: "यो खोजसँग मिल्ने कागजात भेटिएन। अर्को शब्दले खोज्नुहोस्।",
                en: "No document matches that search. Try a different term.",
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-10 sm:px-6" />}>
      <TemplateLibrary />
    </Suspense>
  );
}
