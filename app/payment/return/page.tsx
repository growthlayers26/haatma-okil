"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLang } from "@/components/language-provider";

type State = "checking" | "paid" | "pending" | "failed";

/**
 * Where the gateway sends the user back.
 *
 * This page never reads a status from the URL. It takes only the order id and asks
 * the server to confirm with the gateway — a redirect is an arrival, not a receipt.
 */
function PaymentReturn() {
  const { bi } = useLang();
  const params = useSearchParams();
  const orderId = params.get("order");

  const [state, setState] = useState<State>("checking");
  const startedRef = useRef(false);

  useEffect(() => {
    if (!orderId || startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;

    async function check(attempt: number): Promise<void> {
      const response = await fetch("/api/payment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      }).catch(() => null);

      if (cancelled) return;

      const data = (await response?.json().catch(() => null)) as { status?: State } | null;
      const status = data?.status;

      if (status === "paid" || status === "failed") {
        setState(status);
        return;
      }

      // Wallet settlement can lag the redirect by a few seconds. Back off a little
      // and retry rather than telling the user it failed.
      if (attempt < 4) {
        setTimeout(() => void check(attempt + 1), 1500 * attempt);
        return;
      }
      setState("pending");
    }

    void check(1);
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (!orderId) {
    return (
      <Shell title={bi({ ne: "अर्डर भेटिएन", en: "No order found" })}>
        <p className="text-ink-2">
          {bi({
            ne: "यो लिङ्कमा अर्डरको विवरण छैन।",
            en: "This link doesn't carry an order reference.",
          })}
        </p>
      </Shell>
    );
  }

  if (state === "checking") {
    return (
      <Shell title={bi({ ne: "भुक्तानी जाँच गर्दै", en: "Confirming your payment" })}>
        <p className="text-ink-2">
          {bi({
            ne: "हामी भुक्तानी सेवासँग पुष्टि गर्दैछौं। यो पृष्ठ बन्द नगर्नुहोस्।",
            en: "We're confirming with the payment provider. Please don't close this page.",
          })}
        </p>
      </Shell>
    );
  }

  if (state === "paid") {
    return (
      <Shell title={bi({ ne: "भुक्तानी सफल भयो", en: "Payment confirmed" })} tone="good">
        <p className="text-ink-2">
          {bi({
            ne: "तपाईंको कागजात अब वाटरमार्कबिना डाउनलोड गर्न सकिन्छ।",
            en: "Your document is now available without the watermark.",
          })}
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-block bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {bi({ ne: "मेरो खातामा जानुहोस्", en: "Go to your dashboard" })}
        </Link>
      </Shell>
    );
  }

  if (state === "pending") {
    return (
      <Shell title={bi({ ne: "भुक्तानी प्रक्रियामा छ", en: "Payment still processing" })} tone="warn">
        <p className="text-ink-2">
          {bi({
            ne: "भुक्तानी सेवाले अझै पुष्टि गरेको छैन। रकम कटेको भए केही समयमै तपाईंको खातामा देखिनेछ — दोहोर्‍याएर भुक्तानी नगर्नुहोस्।",
            en: "The provider hasn't confirmed yet. If money left your account it will appear shortly — please don't pay again.",
          })}
        </p>
        <p className="mt-3 font-mono text-xs text-ink-3">
          {bi({ ne: "अर्डर नं.", en: "Order ref." })} {orderId}
        </p>
      </Shell>
    );
  }

  return (
    <Shell title={bi({ ne: "भुक्तानी सफल भएन", en: "Payment not completed" })} tone="bad">
      <p className="text-ink-2">
        {bi({
          ne: "यो भुक्तानी पूरा भएन। तपाईंको कागजात ड्राफ्टमै सुरक्षित छ र फेरि प्रयास गर्न सक्नुहुन्छ।",
          en: "This payment didn't go through. Your draft is safe and you can try again.",
        })}
      </p>
      <Link
        href="/dashboard"
        className="mt-5 inline-block border border-accent px-5 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent-soft"
      >
        {bi({ ne: "ड्राफ्टमा फर्कनुहोस्", en: "Back to your drafts" })}
      </Link>
    </Shell>
  );
}

function Shell({
  title,
  tone = "neutral",
  children,
}: {
  title: string;
  tone?: "neutral" | "good" | "warn" | "bad";
  children: React.ReactNode;
}) {
  const border =
    tone === "good"
      ? "border-malachite"
      : tone === "warn"
        ? "border-orpiment"
        : tone === "bad"
          ? "border-cinnabar"
          : "border-rule-strong";

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <div className={`border-l-2 ${border} bg-surface p-6`}>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">{title}</h1>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-20 sm:px-6" />}>
      <PaymentReturn />
    </Suspense>
  );
}
