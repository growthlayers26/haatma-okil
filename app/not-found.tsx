"use client";

import Link from "next/link";
import { useLang } from "@/components/language-provider";

/**
 * The site's own 404, not Next's bare default.
 *
 * Without this file, an explicit `notFound()` call — the one `/documents/[id]`
 * makes for a deleted, foreign, or mistyped document link, a plausible real link a
 * customer might actually click — rendered with no header, no footer, no
 * navigation, and no branding: literally none of the shell the rest of the site
 * has. A customer arriving from an old bookmark or a shared link saw a dead end
 * with no way back in, which is a worse moment to lose someone than any other page
 * on the site could produce.
 */
export default function NotFound() {
  const { bi } = useLang();

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <p className="font-mono text-sm font-semibold uppercase tracking-[0.16em] text-accent">
        404
      </p>
      <h1 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
        {bi({ ne: "यो पृष्ठ फेला परेन", en: "This page could not be found" })}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-ink-2">
        {bi({
          ne: "लिङ्क गलत भएको, कागजात हटाइएको, वा पृष्ठ सारिएको हुन सक्छ।",
          en: "The link may be wrong, the document may have been removed, or the page may have moved.",
        })}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="inline-block bg-accent px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {bi({ ne: "गृहपृष्ठमा जानुहोस्", en: "Go to the homepage" })}
        </Link>
        <Link
          href="/templates"
          className="inline-block border border-rule-strong px-5 py-3 text-sm font-semibold text-ink-2 transition-colors hover:border-accent hover:text-accent"
        >
          {bi({ ne: "कागजातहरू हेर्नुहोस्", en: "Browse documents" })}
        </Link>
      </div>
    </div>
  );
}
