"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "./language-provider";
import { useAuth } from "./auth-provider";
import { GOVERNMENT_FEE_NOTE } from "@/lib/services";
import { formatNpr, toNepaliDigits } from "@/lib/nepal";
import type { FilingService, Payer } from "@/lib/filings";
import type { Handoff } from "@/lib/payments/types";

/** eSewa needs a signed form POST rather than a redirect; the signature is server-side. */
function submitGatewayForm(action: string, fields: Record<string, string>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

const PAYER_STYLE: Record<Payer, string> = {
  us: "border-accent text-accent",
  you: "border-cinnabar text-cinnabar",
  government: "border-rule-strong text-ink-3",
};

export function FilingServicePage({ service }: { service: FilingService }) {
  const { bi, lang } = useLang();
  const { user } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const money = (n: number) => formatNpr(n, lang);
  const num = (n: number) => (lang === "ne" ? toNepaliDigits(n) : String(n));

  const PAYER_LABEL: Record<Payer, string> = {
    us: bi({ ne: "हामी गर्छौं", en: "We do this" }),
    you: bi({ ne: "तपाईं गर्नुपर्ने", en: "You must do this" }),
    government: bi({ ne: "कार्यालयले गर्दछ", en: "The office does this" }),
  };

  async function buy() {
    setBusy(true);
    setNotice("");
    try {
      if (!user) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      const response = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gateway: "khalti", item: { type: "service", id: service.id } }),
      });
      const data = (await response.json()) as {
        handoff?: Handoff;
        message?: string;
        requiresAuth?: boolean;
      };
      if (data.requiresAuth) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (data.handoff?.mode === "redirect") {
        window.location.href = data.handoff.url;
        return;
      }
      if (data.handoff?.mode === "form") {
        submitGatewayForm(data.handoff.action, data.handoff.fields);
        return;
      }
      setNotice(data.message ?? bi({ ne: "भुक्तानी सुरु गर्न सकिएन।", en: "Could not start the payment." }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="max-w-[22ch] text-balance font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
        {bi(service.title)}
      </h1>
      <p className="mt-3 max-w-[64ch] text-lg text-ink-2">{bi(service.blurb)}</p>
      <p className="mt-2 font-mono text-xs text-ink-3">
        {bi(service.authority)} · {service.portal} · {bi(service.statute.act)}{" "}
        {bi(service.statute.section)}
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <section>
          <h2 className="font-serif text-2xl font-semibold tracking-tight">
            {bi({ ne: "प्रक्रिया", en: "How it works" })}
          </h2>
          <p className="mt-2 max-w-[60ch] text-ink-2">
            {bi({
              ne: "कुन काम हामीले गर्छौं र कुन तपाईं आफैँले गर्नुपर्छ भन्ने स्पष्ट पारिएको छ।",
              en: "Marked so it is clear which steps we carry and which only you can do.",
            })}
          </p>

          <ol className="mt-6 grid gap-px border border-rule bg-rule">
            {service.steps.map((step, i) => (
              <li key={step.label.en} className="flex flex-wrap gap-4 bg-surface p-4">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-accent-soft font-mono text-xs font-semibold text-accent">
                  {num(i + 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <p className="font-semibold">{bi(step.label)}</p>
                    <span
                      className={`border px-1.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider ${PAYER_STYLE[step.who]}`}
                    >
                      {PAYER_LABEL[step.who]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-2">{bi(step.detail)}</p>
                </div>
              </li>
            ))}
          </ol>

          {/* The failure modes. This is the part worth reading. */}
          <h2 className="mt-10 font-serif text-2xl font-semibold tracking-tight">
            {bi({ ne: "बढी हुने गल्ती", en: "What goes wrong" })}
          </h2>
          <div className="mt-4 space-y-4">
            {service.pitfalls.map((p) => (
              <div key={p.label.en} className="border-l-2 border-orpiment bg-surface p-5">
                <p className="font-semibold">{bi(p.label)}</p>
                <p className="mt-1.5 max-w-[62ch] text-sm text-ink-2">{bi(p.detail)}</p>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="border border-rule bg-surface p-5">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-3">
              {bi({ ne: "हाम्रो शुल्क", en: "Our fee" })}
            </p>
            <p className="mt-2 font-serif text-2xl font-semibold tabular-nums">
              {money(service.ourFeeNpr)}
            </p>
            <p className="mt-1 font-mono text-xs text-ink-3">{bi(service.turnaround)}</p>

            <button
              type="button"
              onClick={buy}
              disabled={busy}
              className="mt-4 w-full bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {busy ? "…" : bi({ ne: "सुरु गर्नुहोस्", en: "Get started" })}
            </button>

            {notice && (
              <p className="mt-3 border-l-2 border-orpiment pl-3 text-sm text-ink-2" role="status">
                {notice}
              </p>
            )}
          </div>

          {/*
            Unverified fees render as "confirm the current rate", never as a figure.
            Statutory fees change by notice more often than acts are amended, and a
            confidently wrong number is worse than an admitted unknown.
          */}
          <div className="border border-rule bg-surface p-5">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-3">
              {bi({ ne: "सरकारी दस्तुर", en: "Government fees" })}
            </p>
            <ul className="mt-3 space-y-3">
              {service.governmentFees.map((fee) => (
                <li key={fee.label.en} className="border-t border-dashed border-rule-strong pt-3 first:border-0 first:pt-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm">{bi(fee.label)}</span>
                    <span
                      className={`font-mono text-xs tabular-nums ${fee.verified ? "text-ink-2" : "text-ink-3"}`}
                    >
                      {fee.verified && fee.amountNpr !== null
                        ? fee.amountNpr === 0
                          ? bi({ ne: "नि:शुल्क", en: "No fee" })
                          : money(fee.amountNpr)
                        : bi({ ne: "दर पुष्टि गरिनेछ", en: "rate to confirm" })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink-3">{bi(fee.note)}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-dashed border-rule-strong pt-3 text-sm text-ink-2">
              {bi(GOVERNMENT_FEE_NOTE)}
            </p>
          </div>

          <div className="border-l-2 border-rule-strong bg-surface p-5">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-3">
              {bi({ ne: "आफैँ गर्न चाहनुहुन्छ?", en: "Doing it yourself?" })}
            </p>
            <p className="mt-1.5 text-sm text-ink-2">
              {bi({
                ne: `${service.portal} नि:शुल्क छ र हामी त्यसको पहुँच बेच्दैनौं। हामी निर्णय र प्रक्रियाको काम गर्छौं।`,
                en: `${service.portal} is free and we do not sell access to it. What we sell is the judgement and the follow-through.`,
              })}
            </p>
            <Link href="/advocate" className="mt-3 inline-block text-sm text-accent underline">
              {bi({ ne: "पहिले प्रश्न सोध्नुहोस्", en: "Ask a question first" })}
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
