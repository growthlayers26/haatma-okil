"use client";

import Link from "next/link";
import { useLang } from "@/components/language-provider";
import { SERVICES, GOVERNMENT_FEE_NOTE } from "@/lib/services";
import { formatNpr } from "@/lib/nepal";

/**
 * Everything the firm does beyond handing over a document.
 *
 * Split into work an advocate does directly and work that ends in a government
 * filing, because the two buy very different things: one is counsel, the other is
 * process. Conflating them is how clients end up surprised by what they paid for.
 */
export default function ServicesPage() {
  const { bi, lang } = useLang();
  const money = (n: number) => formatNpr(n, lang);

  const advocateWork = [
    { href: "/advocate", id: "question" as const },
    { href: "/advocate", id: "consultation" as const },
    { href: "/review", id: "document_review" as const },
  ];

  const filings = [
    { href: "/register-company", id: "company_registration" as const },
    { href: "/trademark", id: "trademark" as const },
    { href: "/tax-registration", id: "tax_registration" as const },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
        {bi({ ne: "सेवाहरू", en: "Services" })}
      </h1>
      <p className="mt-3 max-w-[64ch] text-lg text-ink-2">
        {bi({
          ne: "कागजातभन्दा बाहेक फर्मले गर्ने काम। अधिवक्ताको प्रत्यक्ष सेवा र सरकारी दर्ता प्रक्रिया छुट्टाछुट्टै राखिएका छन्।",
          en: "What the firm does beyond handing over a document — advocate's work and government filings, kept separate because they buy different things.",
        })}
      </p>

      <section className="mt-10">
        <h2 className="font-mono text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-ink-3">
          {bi({ ne: "अधिवक्ताको सेवा", en: "An advocate's work" })}
        </h2>
        <div className="mt-3 grid gap-px border border-rule bg-rule sm:grid-cols-3">
          {advocateWork.map(({ href, id }) => (
            <Link key={id} href={href} className="group bg-surface p-5 transition-colors hover:bg-accent-soft">
              <p className="font-serif text-lg font-semibold tracking-tight group-hover:text-accent">
                {bi(SERVICES[id].title)}
              </p>
              <p className="mt-1.5 text-sm text-ink-2">{bi(SERVICES[id].blurb)}</p>
              <p className="mt-3 font-mono text-xs tabular-nums text-ink-3">
                {money(SERVICES[id].priceNpr)} · {bi(SERVICES[id].turnaround)}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-ink-3">
          {bi({ ne: "सरकारी दर्ता", en: "Government filings" })}
        </h2>
        <div className="mt-3 grid gap-px border border-rule bg-rule sm:grid-cols-3">
          {filings.map(({ href, id }) => (
            <Link key={id} href={href} className="group bg-surface p-5 transition-colors hover:bg-accent-soft">
              <p className="font-serif text-lg font-semibold tracking-tight group-hover:text-accent">
                {bi(SERVICES[id].title)}
              </p>
              <p className="mt-1.5 text-sm text-ink-2">{bi(SERVICES[id].blurb)}</p>
              <p className="mt-3 font-mono text-xs tabular-nums text-ink-3">
                {money(SERVICES[id].priceNpr)} · {bi(SERVICES[id].turnaround)}
              </p>
            </Link>
          ))}
        </div>
        <p className="mt-3 max-w-[62ch] text-sm text-ink-2">{bi(GOVERNMENT_FEE_NOTE)}</p>
      </section>

      <div className="mt-10 border-l-2 border-orpiment bg-surface p-5">
        <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-orpiment">
          {bi({ ne: "हामी के बेच्दैनौं", en: "What we do not sell" })}
        </p>
        <p className="mt-1.5 max-w-[62ch] text-sm text-ink-2">
          {bi({
            ne: "सरकारी पोर्टलहरू नि:शुल्क छन् र हामी तिनको पहुँच बेच्दैनौं। हामी निर्णय, मस्यौदा र प्रक्रियाको काम बेच्छौं। सरकारी दस्तुरमा कुनै सेवा शुल्क थपिँदैन।",
            en: "The government portals are free and we do not sell access to them. We sell the judgement, the drafting and the follow-through. Nothing is added on top of a government fee.",
          })}
        </p>
      </div>
    </div>
  );
}
