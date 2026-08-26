"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLang } from "@/components/language-provider";
import { TEMPLATES, CATEGORIES } from "@/lib/templates";
import { formatNpr, toNepaliDigits } from "@/lib/nepal";

export default function HomePage() {
  const { t, bi, lang } = useLang();
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(query.trim() ? `/templates?q=${encodeURIComponent(query.trim())}` : "/templates");
  }

  const priceLabel = (npr: number) => formatNpr(npr, lang);

  return (
    <>
      {/* Hero — search leads, because people arrive knowing the document they need. */}
      <section className="border-b border-rule bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.13em] text-accent">
            {t("brandTagline")}
          </p>
          <h1 className="mt-4 max-w-[19ch] text-balance font-serif text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-4 max-w-[58ch] text-lg text-ink-2">{t("heroBody")}</p>

          <form onSubmit={onSearch} className="mt-8 flex max-w-2xl flex-col gap-2 sm:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("search")}
              className="flex-1 border border-rule-strong bg-ground px-4 py-3 text-base outline-none transition-colors focus:border-accent"
            />
            <button
              type="submit"
              className="bg-accent px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t("search")}
            </button>
          </form>
        </div>
      </section>

      {/* Trust bar sits above the fold — the competition is a free forwarded Word file. */}
      <section className="border-b border-rule bg-surface-2">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-8 gap-y-2 px-4 py-3 sm:px-6">
          {[t("trustLicensed"), t("trustReviewed"), t("trustCited")].map((label) => (
            <span key={label} className="flex items-center gap-2 font-mono text-xs text-ink-2">
              <span aria-hidden className="text-malachite">
                ✓
              </span>
              {label}
            </span>
          ))}
        </div>
      </section>

      {/* Compliance hook — a legal obligation with a penalty converts harder than features. */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="border-l-2 border-orpiment bg-surface p-6 sm:p-8">
          <h2 className="max-w-[28ch] text-balance font-serif text-2xl font-semibold tracking-tight">
            {t("complianceHookTitle")}
          </h2>
          <p className="mt-3 max-w-[64ch] text-ink-2">{t("complianceHookBody")}</p>
          <Link
            href="/create/employment-contract"
            className="mt-5 inline-block bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {bi({ ne: "रोजगार करार बनाउनुहोस्", en: "Create an employment contract" })}
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.1em] text-ink-3">
          {t("popularCategories")}
        </h2>
        <div className="mt-4 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((cat) => {
            const count = TEMPLATES.filter((tpl) => tpl.category === cat.id).length;
            return (
              <Link
                key={cat.id}
                href={`/templates?category=${cat.id}`}
                className="group bg-surface p-5 transition-colors hover:bg-accent-soft"
              >
                <h3 className="font-serif text-lg font-semibold tracking-tight group-hover:text-accent">
                  {bi(cat.label)}
                </h3>
                <p className="mt-1.5 text-sm text-ink-2">{bi(cat.blurb)}</p>
                <p className="mt-3 font-mono text-xs text-ink-3">
                  {count > 0
                    ? `${lang === "ne" ? toNepaliDigits(count) : count} ${t("documentsCount")}`
                    : t("comingSoon")}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Document cards carry citation, price and review date — what a free template can't show. */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.1em] text-ink-3">
          {t("allDocuments")}
        </h2>
        <div className="mt-4 grid gap-px border border-rule bg-rule sm:grid-cols-2">
          {TEMPLATES.map((tpl) => (
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
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
