"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/language-provider";
import { useAuth } from "@/components/auth-provider";
import { PLANS, PLAN_ORDER, planPriceNpr, annualSavingPercent, type PlanId, type BillingPeriod } from "@/lib/plans";
import { getSubscription, type SubscriptionState } from "@/app/actions/subscription";
import { formatNpr, toNepaliDigits } from "@/lib/nepal";
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

export default function PricingPage() {
  const { bi, lang } = useLang();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [period, setPeriod] = useState<BillingPeriod>("annual");
  const [sub, setSub] = useState<SubscriptionState | null>(null);
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!user) return;
    getSubscription().then(setSub);
  }, [user]);

  const money = (n: number) => formatNpr(n, lang);
  const num = (n: number) => (lang === "ne" ? toNepaliDigits(n) : String(n));

  async function subscribe(planId: PlanId) {
    if (planId === "free") return;

    setBusy(planId);
    setNotice("");
    try {
      if (!user) {
        router.push("/login?next=/pricing");
        return;
      }

      // The client names the plan and period; the price is recomputed server-side.
      const response = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gateway: "khalti",
          item: { type: "plan", id: planId, period },
        }),
      });

      const data = (await response.json()) as {
        handoff?: Handoff;
        message?: string;
        requiresAuth?: boolean;
      };

      if (data.requiresAuth) {
        router.push("/login?next=/pricing");
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
      setNotice(
        data.message ??
          bi({ ne: "भुक्तानी सुरु गर्न सकिएन।", en: "Could not start the payment." }),
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="max-w-[22ch] text-balance font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
        {bi({ ne: "योजना तथा मूल्य", en: "Plans and pricing" })}
      </h1>
      <p className="mt-3 max-w-[64ch] text-lg text-ink-2">
        {bi({
          ne: "कागजात तयार गर्न र हेर्न सधैँ नि:शुल्क छ। किन्दा मात्र तिर्नुहोस्, वा नियमित आवश्यकता भए योजना लिनुहोस्।",
          en: "Drafting and previewing is always free. Pay for the documents you take, or take a plan if you need them regularly.",
        })}
      </p>

      {/* Billing period. Annual is preselected because it is the better deal. */}
      <div
        className="mt-8 inline-flex border border-rule-strong"
        role="group"
        aria-label={bi({ ne: "भुक्तानी अवधि", en: "Billing period" })}
      >
        {(["annual", "monthly"] as BillingPeriod[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            aria-pressed={period === p}
            className={`px-4 py-2 text-sm font-semibold transition-colors ${
              period === p ? "bg-accent text-white" : "text-ink-2 hover:text-accent"
            }`}
          >
            {p === "annual"
              ? bi({ ne: "वार्षिक", en: "Annual" })
              : bi({ ne: "मासिक", en: "Monthly" })}
          </button>
        ))}
      </div>
      {period === "annual" && (
        <p className="mt-2 font-mono text-xs text-malachite">
          {bi({
            ne: `वार्षिक लिँदा ${toNepaliDigits(annualSavingPercent("business"))}% सम्म बचत`,
            en: `Save up to ${annualSavingPercent("business")}% paying annually`,
          })}
        </p>
      )}

      <div className="mt-8 grid gap-px border border-rule bg-rule lg:grid-cols-3">
        {PLAN_ORDER.map((id) => {
          const plan = PLANS[id];
          const price = planPriceNpr(id, period);
          const isCurrent = sub?.planId === id;
          const featured = id === "business";

          return (
            <div key={id} className="flex flex-col bg-surface p-6">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-serif text-xl font-semibold tracking-tight">{bi(plan.name)}</h2>
                {featured && (
                  <span className="bg-accent-soft px-2 py-0.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-accent">
                    {bi({ ne: "सिफारिस", en: "Most chosen" })}
                  </span>
                )}
              </div>

              <p className="mt-1.5 min-h-[3rem] text-sm text-ink-2">{bi(plan.tagline)}</p>

              <p className="mt-4 font-serif text-3xl font-semibold tabular-nums">{money(price)}</p>
              {/*
                The free tier shows NPR 0 with "documents charged separately" rather
                than the word "Free" twice. The plan costs nothing; the documents on
                it do, and saying "Free" over the price implies otherwise.
              */}
              <p className="font-mono text-xs text-ink-3">
                {price === 0
                  ? bi({ ne: "योजना शुल्क छैन — कागजात छुट्टै", en: "no plan fee — documents charged separately" })
                  : period === "annual"
                    ? bi({ ne: "प्रति वर्ष", en: "per year" })
                    : bi({ ne: "प्रति महिना", en: "per month" })}
              </p>

              <ul className="mt-5 flex-1 space-y-2">
                {plan.highlights.map((h) => (
                  <li key={h.en} className="flex gap-2 text-sm text-ink-2">
                    <span aria-hidden className="text-malachite">
                      ✓
                    </span>
                    <span>{bi(h)}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <p className="mt-6 border border-malachite px-4 py-2.5 text-center text-sm font-semibold text-malachite">
                  {bi({ ne: "तपाईंको हालको योजना", en: "Your current plan" })}
                </p>
              ) : id === "free" ? (
                <Link
                  href="/templates"
                  className="mt-6 block border border-accent px-4 py-2.5 text-center text-sm font-semibold text-accent transition-colors hover:bg-accent-soft"
                >
                  {bi({ ne: "कागजात हेर्नुहोस्", en: "Browse documents" })}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => subscribe(id)}
                  disabled={busy !== null}
                  className={`mt-6 px-4 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-40 ${
                    featured
                      ? "bg-accent text-white hover:opacity-90"
                      : "border border-accent text-accent hover:bg-accent-soft"
                  }`}
                >
                  {busy === id ? "…" : bi({ ne: "यो योजना लिनुहोस्", en: "Choose this plan" })}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {notice && (
        <p className="mt-4 border-l-2 border-orpiment bg-surface p-3 text-sm text-ink-2" role="status">
          {notice}
        </p>
      )}

      {/* What a subscriber has left this month. */}
      {sub && sub.planId !== "free" && (
        <div className="mt-8 border-l-2 border-malachite bg-surface p-5">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-malachite">
            {bi({ ne: "यो महिना बाँकी", en: "Remaining this month" })}
          </p>
          <p className="mt-1.5 text-sm text-ink-2">
            {bi({ ne: "लिखित प्रश्न", en: "Written questions" })}:{" "}
            <strong className="tabular-nums">{num(sub.questionsRemaining)}</strong>
            {" · "}
            {bi({ ne: "कागजात पुनरावलोकन", en: "Document reviews" })}:{" "}
            <strong className="tabular-nums">{num(sub.reviewsRemaining)}</strong>
          </p>
          <p className="mt-2 font-mono text-xs text-ink-3">
            {bi({
              ne: "मासिक कोटा प्रत्येक महिनाको पहिलो दिन पुन: सुरु हुन्छ।",
              en: "Monthly allowance resets on the first of each month.",
            })}
          </p>
        </div>
      )}

      {/*
        Stated plainly because the alternative is a subscriber discovering it at the
        point they most need help.
      */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="border-l-2 border-orpiment bg-surface p-5">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-orpiment">
            {bi({ ne: "योजनाले के समेट्दैन", en: "What a plan does not cover" })}
          </p>
          <p className="mt-1.5 max-w-[58ch] text-sm text-ink-2">
            {bi({
              ne: "प्रत्यक्ष परामर्श, अदालतमा प्रतिनिधित्व, कम्पनी दर्ता र सरकारी दस्तुर योजनामा समावेश छैनन्। ती छुट्टै शुल्कमा उपलब्ध हुन्छन्।",
              en: "Live consultations, representation in court, company registration and government fees are not included in any plan. Those are charged separately.",
            })}
          </p>
        </div>
        <div className="border-l-2 border-rule-strong bg-surface p-5">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-3">
            {bi({ ne: "मासिक कोटा नपुगे", en: "If you run out mid-month" })}
          </p>
          <p className="mt-1.5 max-w-[58ch] text-sm text-ink-2">
            {bi({
              ne: "कोटा सकिएमा सेवा बन्द हुँदैन — थप विषय प्रति विषय शुल्कमा लिन सकिन्छ।",
              en: "Nothing stops working. Further matters are simply charged per matter at the usual rate.",
            })}
          </p>
        </div>
      </div>

      {!loading && !user && (
        <p className="mt-8 text-sm text-ink-3">
          {bi({
            ne: "योजना लिन लगइन आवश्यक पर्दछ।",
            en: "You'll be asked to sign in before subscribing.",
          })}
        </p>
      )}
    </div>
  );
}
