"use client";

import Link from "next/link";
import { useLang } from "@/components/language-provider";

/**
 * Where a purchase that could not start lands.
 *
 * Bagisto sends people here when the hand-off is unusable — the link expired, was
 * already used, or the item is no longer sold. The person arriving has just pressed
 * "Pay" and is about to wonder whether they were charged, so that is the first thing
 * said. Nothing has been: this page is reached before any cart exists.
 */
export default function PaymentProblemPage() {
  const { bi } = useLang();

  return (
    <div className="mx-auto max-w-lg px-4 py-20 sm:px-6">
      <div className="border-l-2 border-orpiment bg-surface p-6">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          {bi({ ne: "भुक्तानी पृष्ठ खोल्न सकिएन", en: "We couldn't open the payment page" })}
        </h1>

        <p className="mt-3 text-ink-2">
          {bi({
            ne: "तपाईंबाट कुनै रकम काटिएको छैन, र तपाईंको ड्राफ्ट सुरक्षित छ। कृपया कागजात खोलेर फेरि भुक्तानी गर्नुहोस्।",
            en: "Nothing was charged, and your draft is saved. Open the document and press Pay again.",
          })}
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {bi({ ne: "मेरा कागजात", en: "My documents" })}
          </Link>
          <Link
            href="/templates"
            className="border border-rule-strong px-5 py-2.5 text-sm text-ink-2 transition-colors hover:border-accent hover:text-accent"
          >
            {bi({ ne: "सबै कागजात हेर्नुहोस्", en: "Browse documents" })}
          </Link>
        </div>
      </div>
    </div>
  );
}
