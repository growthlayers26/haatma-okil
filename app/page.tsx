"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLang } from "@/components/language-provider";
import { TEMPLATES, CATEGORIES, getTemplate } from "@/lib/templates";
import { formatNpr, toNepaliDigits } from "@/lib/nepal";
import { FIRM } from "@/lib/firm";

/**
 * The documents people actually arrive looking for.
 *
 * Curated rather than complete. Listing all thirty-one was reasonable at four; at
 * thirty-one it is a wall that makes the catalogue feel like a filing cabinet rather
 * than a shop. The full list is one click away for anyone who wants it.
 */
const MOST_NEEDED = [
  "employment-contract",
  "residential-lease",
  "land-sale-deed",
  "power-of-attorney",
  "company-moa",
  "nda",
];

export default function HomePage() {
  const { t, bi, lang } = useLang();
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(query.trim() ? `/templates?q=${encodeURIComponent(query.trim())}` : "/templates");
  }

  const priceLabel = (npr: number) => formatNpr(npr, lang);
  const num = (n: number) => (lang === "ne" ? toNepaliDigits(n) : String(n));

  const featured = MOST_NEEDED.map(getTemplate).filter(
    (x): x is NonNullable<typeof x> => x !== undefined,
  );

  /*
   * Facts, not adjectives.
   *
   * The previous trust row was three grey ticks reading "Bar Council registered ·
   * Advocate reviewed · Statute cited" — claims anyone can make. Counts are checkable
   * and set in tabular numerals, which is what makes them read as a record rather
   * than as marketing.
   */
  const proof = [
    { value: num(TEMPLATES.length), label: bi({ ne: "कागजात", en: "Documents" }) },
    { value: num(FIRM.advocateCount), label: bi({ ne: "इजाजतप्राप्त अधिवक्ता", en: "Licensed advocates" }) },
    { value: "100%", label: bi({ ne: "दफा उल्लेख सहित", en: "Clauses cited to statute" }) },
    // Bilingual output is a genuine differentiator here: the competition is either
    // an English template nobody can execute or a Nepali one nobody drafted.
    { value: num(2), label: bi({ ne: "नेपाली र अङ्ग्रेजी भाषा", en: "Languages, Nepali and English" }) },
  ];

  return (
    <>
      {/*
        Hero.
        Asymmetric on purpose: the headline takes the wide column and the proof
        figures sit beside it, so the first screen carries both the claim and the
        evidence without stacking into a scroll.
      */}
      <section className="border-b border-rule bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                {t("brandTagline")}
              </p>

              {/*
                The single largest change on this page. A legal product earns trust
                partly through typographic authority — a timid headline reads as a
                form, and nobody trusts a form with a land sale.
              */}
              <h1 className="mt-5 max-w-[16ch] text-balance font-serif text-5xl font-semibold leading-[0.98] tracking-[-0.02em] sm:text-6xl lg:text-7xl">
                {t("heroTitle")}
              </h1>

              <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-ink-2">
                {t("heroBody")}
              </p>

              {/*
                Search demoted to a single rule-bounded row. It was a full-width navy
                slab — the loudest thing on the page was a utility control competing
                with the headline for the eye.
              */}
              <form
                onSubmit={onSearch}
                className="mt-10 flex max-w-xl items-center gap-3 border-b-2 border-rule-strong pb-2 transition-colors focus-within:border-accent"
              >
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  aria-label={t("search")}
                  className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-ink-3"
                />
                <button
                  type="submit"
                  className="flex-none font-mono text-xs font-semibold uppercase tracking-wider text-accent transition-opacity hover:opacity-70"
                >
                  {t("search")} →
                </button>
              </form>
            </div>

            {/* Proof column. Hairline-separated so it reads as a record. */}
            <div className="lg:col-span-5 lg:pl-8">
              <dl className="grid grid-cols-2 gap-x-8 gap-y-8 border-t border-rule pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
                {proof.map((p) => (
                  <div key={p.label}>
                    <dt className="font-serif text-4xl font-semibold tabular-nums tracking-tight">
                      {p.value}
                    </dt>
                    <dd className="mt-1.5 max-w-[18ch] font-mono text-[0.7rem] uppercase leading-relaxed tracking-wider text-ink-3">
                      {p.label}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance hook — a legal obligation with a penalty converts harder than features. */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-8 border-l-2 border-orpiment bg-surface p-6 sm:p-9 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <h2 className="max-w-[24ch] text-balance font-serif text-3xl font-semibold leading-tight tracking-tight">
              {t("complianceHookTitle")}
            </h2>
            <p className="mt-4 max-w-[60ch] text-ink-2">{t("complianceHookBody")}</p>
          </div>
          <div className="flex items-end lg:col-span-4">
            <Link
              href="/create/employment-contract"
              className="inline-block bg-accent px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {bi({ ne: "रोजगार करार बनाउनुहोस्", en: "Create an employment contract" })}
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">
          {t("popularCategories")}
        </h2>
        <div className="mt-5 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((cat) => {
            const count = TEMPLATES.filter((tpl) => tpl.category === cat.id).length;
            return (
              <Link
                key={cat.id}
                href={`/templates?category=${cat.id}`}
                className="group bg-surface p-6 transition-colors hover:bg-accent-soft"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-serif text-xl font-semibold tracking-tight group-hover:text-accent">
                    {bi(cat.label)}
                  </h3>
                  <span className="font-mono text-xs tabular-nums text-ink-3">{num(count)}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{bi(cat.blurb)}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* A curated shelf rather than the whole catalogue. */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">
            {bi({ ne: "सबैभन्दा धेरै चाहिने", en: "Most often needed" })}
          </h2>
          <Link
            href="/templates"
            className="font-mono text-xs font-semibold uppercase tracking-wider text-accent transition-opacity hover:opacity-70"
          >
            {bi({ ne: "सबै", en: "All" })} {num(TEMPLATES.length)} →
          </Link>
        </div>

        <div className="mt-5 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((tpl) => (
            <Link
              key={tpl.slug}
              href={`/create/${tpl.slug}`}
              className="group flex flex-col gap-3 bg-surface p-6 transition-colors hover:bg-accent-soft"
            >
              <div>
                <h3 className="font-serif text-xl font-semibold leading-snug tracking-tight group-hover:text-accent">
                  {bi(tpl.title)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{bi(tpl.summary)}</p>
              </div>
              <div className="mt-auto flex flex-wrap items-baseline justify-between gap-2 border-t border-dashed border-rule-strong pt-3">
                {/*
                  The citation is the product. A free Word file forwarded on Viber
                  cannot tell you which provision a clause comes from.
                */}
                <span className="font-mono text-[0.7rem] leading-tight text-ink-3">
                  {bi(tpl.governingAct.act)} {bi(tpl.governingAct.section)}
                </span>
                <span className="font-serif text-base font-semibold tabular-nums">
                  {priceLabel(tpl.priceNpr)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
