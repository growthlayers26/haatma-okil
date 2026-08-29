"use client";

import { useLang } from "./language-provider";
import type { Template } from "@/lib/types";

/**
 * What still has to happen for the document to be an executed instrument.
 *
 * Shown at checkout so nobody buys believing a download is a signed deed, and shown
 * again on the finished document because that is the moment someone is most likely
 * to assume the work is over. On a land sale deed the difference is whether any
 * interest in the land actually moved.
 *
 * Marked no-print: these are instructions to the reader, not terms of the
 * instrument, and printing them onto the deed would confuse the two.
 */
export function ExecutionNotice({ template }: { template: Template }) {
  const { t, bi } = useLang();

  return (
    <div className="no-print mt-8 border-l-2 border-orpiment bg-surface p-4">
      <p className="font-mono text-xs font-semibold uppercase tracking-wider text-orpiment">
        {t("executionTitle")}
      </p>
      <p className="mt-1.5 text-sm text-ink-2">{t("executionNote")}</p>
      <ul className="mt-3 space-y-2">
        {template.execution.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-ink-2">
            <span aria-hidden className="text-orpiment">
              {i + 1}.
            </span>
            {bi(item)}
          </li>
        ))}
      </ul>
    </div>
  );
}
