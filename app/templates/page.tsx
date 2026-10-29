"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLang } from "@/components/language-provider";
import { TEMPLATES, CATEGORIES } from "@/lib/templates";
import { AUDIENCES, getAudience, matchesAudienceKeyword, type AudienceId } from "@/lib/audiences";
import { SERVICES, SERVICE_PATH } from "@/lib/services";
import { formatNpr, toNepaliDigits } from "@/lib/nepal";
import type { Category, Template } from "@/lib/types";

/**
 * The catalogue, set as an index rather than a product grid.
 *
 * Thirty-one uniform cards is a wall: every row the same height, the same weight, no
 * rhythm to scan by. A magazine contents page solves the same problem by grouping
 * under headings and letting the titles carry, and that reads far better for a legal
 * catalogue than an e-commerce shelf does.
 */
function TemplateLibrary() {
  const { t, bi, lang } = useLang();
  const params = useSearchParams();

  const initialCategory = (params.get("category") as Category | null) ?? null;
  const [category, setCategory] = useState<Category | null>(initialCategory);
  const [audience, setAudience] = useState<AudienceId | null>(
    getAudience(params.get("audience"))?.id ?? null,
  );
  const [query, setQuery] = useState(params.get("q") ?? "");

  // Who it is for is a second way into the same catalogue, so it filters alongside
  // the category rather than replacing it.
  const shelf = getAudience(audience);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = TEMPLATES.filter((tpl) => {
      if (category && tpl.category !== category) return false;
      if (shelf && !shelf.documents.includes(tpl.slug)) return false;
      if (!needle) return true;
      // Search both scripts, so "करार" and "contract" both find the same document.
      return (
        tpl.title.en.toLowerCase().includes(needle) ||
        tpl.title.ne.includes(query.trim()) ||
        tpl.summary.en.toLowerCase().includes(needle) ||
        tpl.summary.ne.includes(query.trim()) ||
        // "startup" or "freelancer" is a description of the reader, not a word in any
        // document, so it is matched against who each document is for.
        matchesAudienceKeyword(query, tpl.slug)
      );
    });

    // A shelf reads in the order someone at that stage needs things, not in the order
    // the catalogue happens to list them.
    return shelf
      ? matches.sort((a, b) => shelf.documents.indexOf(a.slug) - shelf.documents.indexOf(b.slug))
      : matches;
  }, [category, shelf, query]);

  /*
   * Grouped under category headings when nothing is filtering, flat when something
   * is — a heading above a single group is furniture, and a search result should
   * read in relevance order rather than be re-sorted into sections.
   */
  const grouped = useMemo(() => {
    const filtering = category !== null || audience !== null || query.trim().length > 0;
    if (filtering) return [{ id: null as Category | null, items: results }];

    return CATEGORIES.map((cat) => ({
      id: cat.id,
      items: results.filter((tpl) => tpl.category === cat.id),
    })).filter((g) => g.items.length > 0);
  }, [results, category, audience, query]);

  const priceLabel = (npr: number) => formatNpr(npr, lang);
  const num = (n: number) => (lang === "ne" ? toNepaliDigits(n) : String(n));

  function Row({ tpl }: { tpl: Template }) {
    return (
      <Link
        href={`/create/${tpl.slug}`}
        className="group grid gap-x-6 gap-y-2 border-b border-rule px-1 py-5 transition-colors last:border-b-0 hover:bg-accent-soft sm:grid-cols-[1fr_auto]"
      >
        <div className="min-w-0">
          <h3 className="font-serif text-xl font-semibold leading-snug tracking-tight group-hover:text-accent">
            {bi(tpl.title)}
          </h3>
          <p className="mt-1.5 max-w-[68ch] text-sm leading-relaxed text-ink-2">
            {bi(tpl.summary)}
          </p>
          {/*
            The citation is what a forwarded Word file cannot show, so it stays on
            the row. The review date does not: it is identical on all thirty-one
            today, so repeating it adds height without adding information. It lives
            on the document itself, where it is about that document.
          */}
          <p className="mt-2 font-mono text-[0.7rem] leading-tight text-ink-3">
            {bi(tpl.governingAct.act)} {bi(tpl.governingAct.section)}
          </p>
        </div>

        <div className="sm:pt-1 sm:text-right">
          <span className="font-mono text-sm tabular-nums text-ink-2">
            {priceLabel(tpl.priceNpr)}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-serif text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
        {t("allDocuments")}
      </h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-[14rem_1fr] lg:gap-16">
        {/*
          Scrolls within itself when taller than the screen. It is sticky, so on a short
          window the filters below the fold would otherwise be unreachable — the page
          scrolls, the sidebar stays put, and the last filter is never in view.
        */}
        <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("search")}
            className="w-full border-b-2 border-rule-strong bg-transparent py-2 text-sm outline-none transition-colors placeholder:text-ink-3 focus:border-accent"
          />

          {/*
            Filters as a list of links rather than a row of bordered buttons. Boxed
            chips read as five competing calls to action; a quiet list reads as
            navigation, which is what it is.
          */}
          <nav className="mt-8 flex flex-wrap gap-x-5 gap-y-2 lg:flex-col lg:gap-y-3">
            <button
              type="button"
              onClick={() => setCategory(null)}
              aria-current={category === null}
              className={`py-2 text-left font-mono text-[0.72rem] uppercase tracking-[0.08em] transition-colors ${
                category === null ? "text-accent" : "text-ink-3 hover:text-accent"
              }`}
            >
              {t("allDocuments")} · {num(TEMPLATES.length)}
            </button>
            {CATEGORIES.map((cat) => {
              const count = TEMPLATES.filter((tpl) => tpl.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  aria-current={category === cat.id}
                  className={`py-2 text-left font-mono text-[0.72rem] uppercase tracking-[0.08em] transition-colors ${
                    category === cat.id ? "text-accent" : "text-ink-3 hover:text-accent"
                  }`}
                >
                  {bi(cat.label)} · {num(count)}
                </button>
              );
            })}
          </nav>

          <p className="mt-8 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-ink-3">
            {bi({ ne: "कसका लागि", en: "Who it's for" })}
          </p>
          <nav className="mt-1 flex flex-wrap gap-x-5 gap-y-2 lg:flex-col lg:gap-y-3">
            <button
              type="button"
              onClick={() => setAudience(null)}
              aria-current={audience === null}
              className={`py-2 text-left font-mono text-[0.72rem] uppercase tracking-[0.08em] transition-colors ${
                audience === null ? "text-accent" : "text-ink-3 hover:text-accent"
              }`}
            >
              {bi({ ne: "सबै", en: "Anyone" })}
            </button>
            {AUDIENCES.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAudience(a.id)}
                aria-current={audience === a.id}
                className={`py-2 text-left font-mono text-[0.72rem] uppercase tracking-[0.08em] transition-colors ${
                  audience === a.id ? "text-accent" : "text-ink-3 hover:text-accent"
                }`}
              >
                {bi(a.label)} · {num(a.documents.length)}
              </button>
            ))}
          </nav>
        </aside>

        <div>
          {shelf && (
            <div className="mb-8 border-l-2 border-accent bg-surface p-5">
              <h2 className="font-serif text-2xl font-semibold tracking-tight">{bi(shelf.label)}</h2>
              <p className="mt-1.5 max-w-[60ch] text-sm leading-relaxed text-ink-2">
                {bi(shelf.blurb)}
              </p>
            </div>
          )}

          {results.length === 0 ? (
            <p className="border border-dashed border-rule-strong p-8 text-ink-2">
              {bi({
                ne: "यो खोजसँग मिल्ने कागजात भेटिएन। अर्को शब्दले खोज्नुहोस्।",
                en: "No document matches that search. Try a different term.",
              })}
            </p>
          ) : (
            grouped.map((group) => {
              const cat = CATEGORIES.find((c) => c.id === group.id);
              return (
                <section key={group.id ?? "all"} className="mb-12 last:mb-0">
                  {cat && (
                    <div className="mb-2 flex items-baseline justify-between gap-4 border-b-2 border-ink pb-2">
                      <h2 className="font-mono text-[0.72rem] font-semibold uppercase tracking-[0.12em]">
                        {bi(cat.label)}
                      </h2>
                      <span className="font-mono text-[0.72rem] tabular-nums text-ink-3">
                        {num(group.items.length)}
                      </span>
                    </div>
                  )}
                  {!cat && (
                    <p className="mb-2 border-b border-rule pb-2 font-mono text-[0.72rem] uppercase tracking-[0.08em] text-ink-3">
                      {num(results.length)} {t("documentsCount")}
                    </p>
                  )}
                  <div>
                    {group.items.map((tpl) => (
                      <Row key={tpl.slug} tpl={tpl} />
                    ))}
                  </div>
                </section>
              );
            })
          )}

          {/*
            The filings that belong beside these documents, and a way out for whoever
            needs something the shelf does not have. Both are existing pages — this is
            a route to them, not a second copy.
          */}
          {shelf && (
            <section className="mt-12 border-t-2 border-ink pt-4">
              <h2 className="font-mono text-[0.72rem] font-semibold uppercase tracking-[0.12em]">
                {bi({ ne: "यिनसँग जाने सेवा", en: "Services that go with these" })}
              </h2>
              <div className="mt-3 grid gap-px border border-rule bg-rule sm:grid-cols-3">
                {shelf.services.map((id) => (
                  <Link
                    key={id}
                    href={SERVICE_PATH[id]}
                    className="group bg-surface p-4 transition-colors hover:bg-accent-soft"
                  >
                    <p className="font-serif text-lg font-semibold tracking-tight group-hover:text-accent">
                      {bi(SERVICES[id].title)}
                    </p>
                    <p className="mt-1.5 text-sm text-ink-2">{bi(SERVICES[id].blurb)}</p>
                    <p className="mt-3 font-mono text-xs tabular-nums text-ink-3">
                      {formatNpr(SERVICES[id].priceNpr, lang)}
                    </p>
                  </Link>
                ))}
              </div>
              <p className="mt-5 text-sm text-ink-2">
                {bi({ ne: "चाहिएको कागजात यहाँ छैन?", en: "Need something that is not listed?" })}{" "}
                <Link href="/advocate" className="text-accent underline underline-offset-4">
                  {bi({ ne: "अधिवक्तालाई सोध्नुहोस्।", en: "Ask an advocate." })}
                </Link>
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-12 sm:px-6" />}>
      <TemplateLibrary />
    </Suspense>
  );
}
