"use client";

import Link from "next/link";
import { useLang } from "@/components/language-provider";
import { POST_REGISTRATION_CHAIN, OCR_FACTS } from "@/lib/templates";
import { SERVICES, GOVERNMENT_FEE_NOTE } from "@/lib/services";
import { formatNpr, toNepaliDigits } from "@/lib/nepal";

/**
 * Company registration.
 *
 * OCR's CAMIS portal is free and already online, so this deliberately does not sell
 * access to it. It sells the three things founders actually get wrong: drafting that
 * survives OCR review, a name that clears first time, and the post-registration chain
 * nobody tells you about until you are non-compliant.
 */
export default function RegisterCompanyPage() {
  const { bi, lang } = useLang();
  const money = (n: number) => formatNpr(n, lang);
  const num = (n: number) => (lang === "ne" ? toNepaliDigits(n) : String(n));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="max-w-[20ch] text-balance font-serif text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
        {bi({ ne: "नेपालमा कम्पनी दर्ता", en: "Register a company in Nepal" })}
      </h1>
      <p className="mt-3 max-w-[62ch] text-lg text-ink-2">
        {bi({
          ne: "कम्पनी रजिस्ट्रारको पोर्टल नि:शुल्क छ र हामी त्यसको पहुँच बेच्दैनौं। हामी प्रबन्धपत्रको मस्यौदा, नाम स्वीकृति र दर्तापछिका दायित्वको काम गर्छौं।",
          en: "The Registrar's portal is free and we don't sell access to it. We draft the documents that survive its review, get the name cleared, and walk the chain of registrations that comes after.",
        })}
      </p>

      {/* The facts, stated plainly — this is the trust-building section. */}
      <dl className="mt-8 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            k: { ne: "न्यूनतम चुक्ता पुँजी", en: "Minimum paid-up capital" },
            v: money(OCR_FACTS.minPaidUpNpr),
          },
          {
            k: { ne: "न्यूनतम शेयरधनी", en: "Minimum shareholders" },
            v: num(OCR_FACTS.minShareholders),
          },
          {
            k: { ne: "सरकारी दर्ता दस्तुर", en: "Government registration fee" },
            v: money(OCR_FACTS.registrationFeeNpr),
          },
          {
            k: { ne: "नाम स्वीकृति", en: "Name reservation" },
            v: bi(OCR_FACTS.nameReservationDays),
          },
        ].map((f) => (
          <div key={f.k.en} className="bg-surface p-4">
            <dt className="font-mono text-xs uppercase tracking-wider text-ink-3">{bi(f.k)}</dt>
            <dd className="mt-1 font-serif text-xl font-semibold tabular-nums">{f.v}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 font-mono text-xs text-ink-3">
        {bi({
          ne: `सम्पूर्ण प्रक्रिया ${OCR_FACTS.portal} को ${OCR_FACTS.system} प्रणालीमार्फत अनलाइन हुन्छ।`,
          en: `The whole process runs online through the ${OCR_FACTS.system} system at ${OCR_FACTS.portal}.`,
        })}
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <section>
          <h2 className="font-serif text-2xl font-semibold tracking-tight">
            {bi({ ne: "दर्तापछि के-के गर्नुपर्छ", en: "What comes after registration" })}
          </h2>
          <p className="mt-2 max-w-[60ch] text-ink-2">
            {bi({
              ne: "प्रमाणपत्र पाएपछि काम सकिँदैन। धेरै संस्थापक यहीँ चुक्छन् र थाहै नपाई अनुपालनबाट बाहिर पुग्छन्।",
              en: "The certificate is not the finish line. This is the chain founders miss, and it's how a new company ends up non-compliant without knowing it.",
            })}
          </p>

          {/* Numbered because this genuinely is a sequence — each step gates the next. */}
          <ol className="mt-6 grid gap-px border border-rule bg-rule">
            {POST_REGISTRATION_CHAIN.map((item) => (
              <li key={item.step} className="flex gap-4 bg-surface p-4">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-accent-soft font-mono text-xs font-semibold text-accent">
                  {num(item.step)}
                </span>
                <div>
                  <p className="font-semibold">{bi(item.label)}</p>
                  <p className="mt-0.5 text-sm text-ink-2">{bi(item.detail)}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-8 border-l-2 border-orpiment bg-surface p-5">
            <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-orpiment">
              {bi({ ne: "नाम अस्वीकृत भएमा", en: "If the name is rejected" })}
            </p>
            <p className="mt-1.5 max-w-[60ch] text-sm text-ink-2">
              {bi({
                ne: "नाम स्वीकृत नभई पेस गरिएका कागजात पुन: तयार गर्नुपर्ने हुन्छ। त्यसैले नाम स्वीकृति पहिले गरिन्छ, मस्यौदा पछि।",
                en: "A rejected name means redrafting and refiling everything behind it. That's why we clear the name first and draft second. The opposite order is the most common and most expensive mistake.",
              })}
            </p>
          </div>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="border border-rule bg-surface p-5">
            <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-ink-3">
              {bi(SERVICES.company_registration.title)}
            </p>
            <p className="mt-2 font-serif text-2xl font-semibold tabular-nums">
              {money(SERVICES.company_registration.priceNpr)}
            </p>
            <p className="mt-1.5 text-sm text-ink-2">
              {bi(SERVICES.company_registration.blurb)}
            </p>
            <p className="mt-3 font-mono text-xs text-ink-3">
              {bi(SERVICES.company_registration.turnaround)}
            </p>
            <p className="mt-3 border-t border-dashed border-rule-strong pt-3 text-sm text-ink-2">
              {bi(GOVERNMENT_FEE_NOTE)}
            </p>
            <Link
              href="/advocate"
              className="mt-4 block bg-accent px-4 py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {bi({ ne: "अधिवक्तासँग कुरा गर्नुहोस्", en: "Talk to an advocate" })}
            </Link>
          </div>

          <div className="border border-rule bg-surface p-5">
            <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-ink-3">
              {bi({ ne: "आफैँ गर्न चाहनुहुन्छ?", en: "Doing it yourself?" })}
            </p>
            <p className="mt-1.5 text-sm text-ink-2">
              {bi({
                ne: "प्रबन्धपत्र मात्र आफैँ तयार गर्न सक्नुहुन्छ।",
                en: "You can draft just the memorandum and file it yourself.",
              })}
            </p>
            <Link
              href="/create/company-moa"
              className="mt-3 block border border-accent px-4 py-2.5 text-center text-sm font-semibold text-accent transition-colors hover:bg-accent-soft"
            >
              {bi({ ne: "प्रबन्धपत्र बनाउनुहोस्", en: "Draft the memorandum" })}
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
