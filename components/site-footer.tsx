"use client";

import { useLang } from "./language-provider";

export function SiteFooter() {
  const { t, lang } = useLang();

  return (
    <footer className="no-print border-t border-rule bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-serif text-base font-semibold">Mandala Law</span>
          <span className="font-deva text-sm text-accent">मण्डल ल फर्म</span>
        </div>

        <p className="mt-3 max-w-[62ch] text-sm text-ink-2">{t("disclaimer")}</p>

        <p className="mt-4 border-t border-rule pt-4 font-mono text-xs text-ink-3">
          {lang === "ne"
            ? "नेपाल बार काउन्सिलमा दर्ता भएका अधिवक्ताद्वारा सञ्चालित।"
            : "Operated by advocates registered with the Nepal Bar Council."}
        </p>
      </div>
    </footer>
  );
}
