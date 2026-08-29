"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/language-provider";
import { useAuth } from "@/components/auth-provider";
import { reviewContract, type ReviewOutcome } from "@/app/actions/review";
import type { Severity } from "@/lib/review/rules";
import { formatNpr, toNepaliDigits } from "@/lib/nepal";
import type { Handoff } from "@/lib/payments/types";

/** eSewa takes a signed form POST rather than a redirect; the signature is server-side. */
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

const SEVERITY_STYLE: Record<Severity, { border: string; text: string }> = {
  breach: { border: "border-cinnabar", text: "text-cinnabar" },
  missing: { border: "border-orpiment", text: "text-orpiment" },
  check: { border: "border-rule-strong", text: "text-ink-3" },
};

export default function ReviewPage() {
  const { bi, lang } = useLang();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ReviewOutcome | null>(null);

  const num = (n: number) => (lang === "ne" ? toNepaliDigits(n) : String(n));

  const SEVERITY_LABEL: Record<Severity, string> = {
    breach: bi({ ne: "कानुनी सीमासँग बाझिएको", en: "Conflicts with a statutory limit" }),
    missing: bi({ ne: "छुटेको व्यवस्था", en: "Missing provision" }),
    check: bi({ ne: "हेर्नुपर्ने", en: "Worth checking" }),
  };

  async function payForReview() {
    setBusy(true);
    try {
      const response = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gateway: "khalti",
          item: { type: "service", id: "document_review" },
        }),
      });
      const data = (await response.json()) as { handoff?: Handoff; requiresAuth?: boolean };
      if (data.requiresAuth) {
        router.push("/login?next=/review");
        return;
      }
      if (data.handoff?.mode === "redirect") {
        window.location.href = data.handoff.url;
        return;
      }
      if (data.handoff?.mode === "form") {
        submitGatewayForm(data.handoff.action, data.handoff.fields);
      }
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      router.push("/login?next=/review");
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      setResult(await reviewContract({ text }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="max-w-[24ch] text-balance font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
        {bi({ ne: "करार जाँच", en: "Check a contract" })}
      </h1>
      <p className="mt-3 max-w-[64ch] text-lg text-ink-2">
        {bi({
          ne: "तपाईंसँग भएको करार यहाँ टाँस्नुहोस्। हामी त्यसका अंकहरू नेपाली कानुनका तोकिएका सीमासँग भिडाएर अधिवक्तासँग सोध्नुपर्ने बुँदाहरू तयार गर्छौं।",
          en: "Paste a contract you have been given. We compare its figures against the statutory limits we hold on file and turn the gaps into questions for an advocate.",
        })}
      </p>

      {/*
        The most important text on the page. This tool produces questions, not
        answers — only a licensed advocate may advise, and saying so plainly is both
        the honest framing and the lawful one.
      */}
      <div className="mt-6 border-l-2 border-orpiment bg-surface p-5">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-orpiment">
          {bi({ ne: "यो कानुनी राय होइन", en: "This is not legal advice" })}
        </p>
        <p className="mt-1.5 max-w-[62ch] text-sm text-ink-2">
          {bi({
            ne: "यहाँ देखिने बुँदाहरू कानुनी राय होइनन् — ती अधिवक्तासँग सोध्नका लागि तयार पारिएका प्रश्न हुन्। कानुनी राय नेपाल बार काउन्सिलबाट इजाजतप्राप्त अधिवक्ताले मात्र दिन सक्नुहुन्छ।",
            en: "What appears below are questions prepared for an advocate, not conclusions about your position. Only an advocate licensed by the Nepal Bar Council can advise you on it.",
          })}
        </p>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="contract" className="block text-sm font-semibold">
            {bi({ ne: "करारको पाठ", en: "The contract text" })}
          </label>
          <textarea
            id="contract"
            rows={14}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={bi({
              ne: "करारको पूरा पाठ यहाँ टाँस्नुहोस्। नेपाली वा अङ्ग्रेजी दुवै हुन सक्छ।",
              en: "Paste the full text of the contract. Nepali or English both work.",
            })}
            className="mt-1.5 w-full border border-rule-strong bg-surface px-3 py-2.5 font-mono text-sm outline-none transition-colors focus:border-accent"
          />
          <p className="mt-1.5 flex flex-wrap justify-between gap-2 font-mono text-xs text-ink-3">
            <span>
              {bi({
                ne: "हामी तपाईंको कागजात भण्डारण गर्दैनौं — जाँचपछि पाठ मेटिन्छ।",
                en: "We do not store your document — the text is discarded after the check.",
              })}
            </span>
            <span className="tabular-nums">{num(text.length)}</span>
          </p>
        </div>

        <button
          type="submit"
          disabled={busy || text.trim().length < 200}
          className="bg-accent px-5 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy
            ? bi({ ne: "जाँच हुँदैछ…", en: "Checking…" })
            : bi({ ne: "जाँच गर्नुहोस्", en: "Check the contract" })}
        </button>

        {!loading && !user && (
          <p className="text-sm text-ink-3">
            {bi({ ne: "जाँच गर्न लगइन आवश्यक छ।", en: "You'll be asked to sign in to run a check." })}
          </p>
        )}
      </form>

      {/* ---------------- results ---------------- */}
      {result && !result.ok && result.reason === "payment_required" && (
        <div className="mt-6 border-l-2 border-accent bg-surface p-5">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
            {bi({ ne: "भुक्तानी आवश्यक", en: "Payment needed" })}
          </p>
          <p className="mt-1.5 max-w-[60ch] text-sm text-ink-2">
            {bi({
              ne: "करार जाँच प्रति पटक शुल्क लाग्दछ। व्यवसाय वा संस्थागत योजनामा हरेक महिना केही जाँच समावेश हुन्छन्।",
              en: "A contract check is charged per review. The Business and Enterprise plans include a number of them each month.",
            })}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={payForReview}
              disabled={busy}
              className="bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {busy
                ? "…"
                : `${bi({ ne: "भुक्तानी गर्नुहोस्", en: "Pay" })} — ${formatNpr(result.priceNpr ?? 0, lang)}`}
            </button>
            <Link href="/pricing" className="text-sm text-accent underline">
              {bi({ ne: "योजना हेर्नुहोस्", en: "See plans" })}
            </Link>
          </div>
          <p className="mt-3 font-mono text-xs text-ink-3">
            {bi({
              ne: "भुक्तानीपछि यही पृष्ठमा फर्केर पाठ फेरि टाँस्नुहोस्।",
              en: "After paying, return here and paste the text again — your payment is held until a check completes.",
            })}
          </p>
        </div>
      )}

      {result && !result.ok && result.reason !== "payment_required" && (
        <p className="mt-6 border-l-2 border-cinnabar bg-surface p-4 text-sm text-ink-2" role="alert">
          {result.reason === "not_configured"
            ? bi({
                ne: "यो सुविधा अहिले कन्फिगर गरिएको छैन।",
                en: "Contract review is not configured in this environment.",
              })
            : result.reason === "too_long"
              ? bi({
                  ne: "कागजात धेरै लामो भयो। कृपया भागमा विभाजन गरेर जाँच गर्नुहोस्।",
                  en: "That document is too long to check in one pass. Split it and check each part — we refuse rather than read only half of it.",
                })
              : result.reason === "refused"
                ? bi({
                    ne: "यो कागजात स्वतः जाँच गर्न सकिएन। कृपया अधिवक्तासँग सम्पर्क गर्नुहोस्।",
                    en: "This document could not be checked automatically. Please take it to an advocate.",
                  })
                : bi({ ne: "जाँच पूरा हुन सकेन।", en: "The check could not be completed." })}
        </p>
      )}

      {result && result.ok && (
        <section className="mt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rule pb-3">
            <h2 className="font-serif text-2xl font-semibold tracking-tight">
              {bi({ ne: "अधिवक्तासँग सोध्नुपर्ने बुँदा", en: "Points to raise with an advocate" })}
            </h2>
            <p className="font-mono text-xs text-ink-3">
              {result.coveredByPlan
                ? bi({ ne: "योजनामा समावेश", en: "Included in your plan" })
                : formatNpr(result.priceNpr, lang)}
            </p>
          </div>

          <dl className="mt-4 grid gap-px border border-rule bg-rule sm:grid-cols-3">
            {(["breach", "missing", "check"] as Severity[]).map((s) => (
              <div key={s} className="bg-surface p-4">
                <dt className="font-mono text-xs uppercase tracking-wider text-ink-3">
                  {SEVERITY_LABEL[s]}
                </dt>
                <dd className={`mt-1 font-serif text-2xl font-semibold tabular-nums ${SEVERITY_STYLE[s].text}`}>
                  {num(result.summary[s])}
                </dd>
              </div>
            ))}
          </dl>

          {result.findings.length === 0 ? (
            <p className="mt-6 border border-dashed border-rule-strong p-6 text-sm text-ink-2">
              {bi({
                ne: "हामीले जाँच गर्ने सीमाहरूसँग कुनै स्पष्ट बाझिने कुरा भेटिएन। यसको अर्थ कागजात ठीक छ भन्ने होइन — हामीले जाँच्न सक्ने कुरा सीमित छन्।",
                en: "Nothing conflicted with the limits we check. That does not mean the document is sound — what we can check is narrow, and only an advocate can read it properly.",
              })}
            </p>
          ) : (
            <ul className="mt-6 space-y-4">
              {result.findings.map((f) => (
                <li key={f.id} className={`border-l-2 bg-surface p-5 ${SEVERITY_STYLE[f.severity].border}`}>
                  <p className={`font-mono text-xs font-semibold uppercase tracking-wider ${SEVERITY_STYLE[f.severity].text}`}>
                    {SEVERITY_LABEL[f.severity]}
                  </p>
                  <h3 className="mt-1.5 font-serif text-lg font-semibold tracking-tight">{bi(f.title)}</h3>
                  <p className="mt-1.5 text-sm text-ink-2">{bi(f.detail)}</p>

                  <p className="mt-3 border-t border-dashed border-rule-strong pt-3 text-sm">
                    <span className="font-semibold">{bi({ ne: "सोध्नुहोस्", en: "Ask" })}: </span>
                    <span className="text-ink-2">{bi(f.ask)}</span>
                  </p>

                  {f.citation && (
                    <p className="mt-2 font-mono text-xs text-ink-3">
                      → {bi(f.citation.act)} {bi(f.citation.section)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* The escalation this feature exists to create. */}
          <div className="mt-8 border border-rule bg-surface p-5">
            <h3 className="font-serif text-lg font-semibold tracking-tight">
              {bi({ ne: "यी प्रश्न अधिवक्तालाई पठाउनुहोस्", en: "Put these questions to an advocate" })}
            </h3>
            <p className="mt-1.5 max-w-[60ch] text-sm text-ink-2">
              {bi({
                ne: "फर्मका इजाजतप्राप्त अधिवक्ताले तपाईंको कागजात हेरी लिखित जवाफ दिनुहुनेछ।",
                en: "One of the firm's licensed advocates will read the document itself and answer in writing.",
              })}
            </p>
            <Link
              href="/advocate"
              className="mt-4 inline-block bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {bi({ ne: "अधिवक्ता डेस्कमा जानुहोस्", en: "Go to the advocate desk" })}
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
