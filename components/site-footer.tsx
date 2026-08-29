"use client";

import { useLang } from "./language-provider";
import { FIRM } from "@/lib/firm";

export function SiteFooter() {
  const { t, lang } = useLang();

  return (
    <footer className="no-print border-t border-rule bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-serif text-base font-semibold">Haatma Okil</span>
          <span className="font-deva text-sm text-accent">हातमा वकिल</span>
        </div>

        <p className="mt-3 max-w-[62ch] text-sm text-ink-2">{t("disclaimer")}</p>

        {/*
          A law firm's site with no way to reach it is its own problem. Each line is
          rendered only when the firm has supplied it — an invented phone number on a
          law firm's own site would be a false representation.
        */}
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs">
          <a href={`mailto:${FIRM.email}`} className="inline-block py-3 text-accent transition-opacity hover:opacity-70">
            {FIRM.email}
          </a>
          {FIRM.phone && <span className="text-ink-2">{FIRM.phone}</span>}
          {FIRM.address && <span className="text-ink-2">{FIRM.address}</span>}
        </div>

        <p className="mt-4 border-t border-rule pt-4 font-mono text-xs text-ink-3">
          {lang === "ne"
            ? "नेपाल बार काउन्सिलमा दर्ता भएका अधिवक्ताद्वारा सञ्चालित।"
            : "Operated by advocates registered with the Nepal Bar Council."}
        </p>
      </div>
    </footer>
  );
}
