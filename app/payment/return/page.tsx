"use client";

import Link from "next/link";
import { useLang } from "@/components/language-provider";

/**
 * Where an old payment link lands.
 *
 * This page used to poll `/api/payment/verify` and wait for the gateway's answer.
 * Bagisto owns checkout now, and that endpoint is gone — so the polling version would
 * have sat on a spinner forever for anyone who reached it from a stale tab or a
 * gateway callback configured before the move.
 *
 * Kept rather than deleted precisely for those people: the ones most likely to arrive
 * here are mid-payment and anxious about money, and a 404 answers none of that. It
 * says where the receipt is and where the document is, and asserts nothing about
 * whether the payment succeeded, because this page has no way to know.
 */
export default function PaymentReturnPage() {
  const { bi } = useLang();

  return (
    <div className="mx-auto max-w-lg px-4 py-20 sm:px-6">
      <div className="border-l-2 border-accent bg-surface p-6">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          {bi({ ne: "भुक्तानी अब पसलबाट हुन्छ", en: "Payment is handled by the shop" })}
        </h1>

        <p className="mt-3 text-ink-2">
          {bi({
            ne: "तपाईंको अर्डर र रसिद पसलको खातामा छ। भुक्तानी सफल भएको भए, कागजात खोल्न ड्यासबोर्डमा जानुहोस्।",
            en: "Your order and receipt live in your shop account. If the payment went through, open your dashboard to apply it to a document.",
          })}
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {bi({ ne: "ड्यासबोर्ड खोल्नुहोस्", en: "Open dashboard" })}
          </Link>
        </div>
      </div>
    </div>
  );
}
