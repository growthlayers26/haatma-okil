"use client";

import Link from "next/link";
import { useLang } from "@/components/language-provider";

/**
 * The controls beside a finished document.
 *
 * Printing is the PDF path: the browser's own engine shapes Devanagari correctly,
 * which a JS PDF library will not without an embedded font and a shaping pass. The
 * print stylesheet hides everything marked .no-print, so what reaches paper is the
 * instrument alone.
 */
export function DocumentActions({ templateSlug }: { templateSlug: string }) {
  const { bi } = useLang();

  return (
    <div className="no-print mb-6 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => window.print()}
        className="bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        {bi({ ne: "छाप्नुहोस् वा PDF बनाउनुहोस्", en: "Print or save as PDF" })}
      </button>
      <Link
        href={`/create/${templateSlug}`}
        className="border border-rule-strong px-4 py-2.5 text-sm text-ink-2 transition-colors hover:border-accent hover:text-accent"
      >
        {bi({ ne: "उत्तरहरू हेर्नुहोस्", en: "View your answers" })}
      </Link>
      <Link
        href="/sign"
        className="border border-rule-strong px-4 py-2.5 text-sm text-ink-2 transition-colors hover:border-accent hover:text-accent"
      >
        {bi({ ne: "हस्ताक्षरका लागि पठाउनुहोस्", en: "Send for signature" })}
      </Link>
    </div>
  );
}
