"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/language-provider";
import { useAuth } from "@/components/auth-provider";
import {
  PLANS,
  PLAN_ORDER,
  planPriceNpr,
  annualSavingPercent,
  type PlanId,
  type BillingPeriod,
  type Entitlements,
} from "@/lib/plans";
import { getSubscription, type SubscriptionState } from "@/app/actions/subscription";
import { formatNpr, toNepaliDigits } from "@/lib/nepal";
import { PageHeader, SectionLabel, Callout, PrimaryButton } from "@/components/ui";
import type { Handoff } from "@/lib/payments/types";
import type { Bilingual } from "@/lib/types";

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

/**
 * What separates the plans, as rows.
 *
 * Three cards of bullet points can only say what a tier includes. A row per
 * entitlement says what the cheaper tier does NOT — which is the comparison someone
 * choosing between them is actually making, and the one cards structurally hide.
 */
type Row = {
  label: Bilingual;
  read: (e: Entitlements) => ReactNode;
};

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

  const none = <span className="text-ink-3">—</span>;
  const yes = <span className="text-malachite">✓</span>;
  const unlimited = bi({ ne: "असीमित", en: "Unlimited" });

  const ROWS: Row[] = [
    {
      label: { ne: "कागजात", en: "Documents" },
      read: (e) =>
        e.documentsPerYear === null ? (
          unlimited
        ) : (
          <span className="text-ink-3">{bi({ ne: "प्रति कागजात", en: "Charged each" })}</span>
        ),
    },
    {
      label: { ne: "मासिक लिखित प्रश्न", en: "Advocate questions a month" },
      read: (e) => (e.questionsPerMonth > 0 ? num(e.questionsPerMonth) : none),
    },
    {
      label: { ne: "मासिक कागजात जाँच", en: "Contract reviews a month" },
      read: (e) => (e.reviewsPerMonth > 0 ? num(e.reviewsPerMonth) : none),
    },
    {
      label: { ne: "प्रयोगकर्ता", en: "Users" },
      read: (e) => num(e.seats),
    },
    {
      label: { ne: "आफ्नै ढाँचा", en: "Your own templates" },
      read: (e) => (e.customTemplates ? yes : none),
    },
    {
      label: { ne: "स्वीकृति प्रक्रिया", en: "Approval workflow" },
      read: (e) => (e.approvalWorkflow ? yes : none),
    },
    {
      label: { ne: "प्राथमिकता", en: "Priority turnaround" },
      read: (e) => (e.prioritySupport ? yes : none),
    },
  ];

  async function subscribe(planId: PlanId) {
    if (planId === "free") return;
    setBusy(planId);
    setNotice("");
    try {
      if (!user) {
        router.push("/login?next=/pricing");
        return;
      }
      const response = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gateway: "khalti", item: { type: "plan", id: planId, period } }),
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
        data.message ?? bi({ ne: "भुक्तानी सुरु गर्न सकिएन।", en: "Could not start the payment." }),
      );
    } finally {
      setBusy(null);
    }
  }

  function PlanAction({ id }: { id: PlanId }) {
    if (sub?.planId === id) {
      return (
        <span className="block border border-malachite px-3 py-2 text-center font-mono text-[0.7rem] uppercase tracking-wider text-malachite">
          {bi({ ne: "हालको", en: "Current" })}
        </span>
      );
    }
    if (id === "free") {
      return (
        <Link
          href="/templates"
          className="block border border-rule-strong px-3 py-2 text-center text-sm text-ink-2 transition-colors hover:border-accent hover:text-accent"
        >
          {bi({ ne: "कागजात हेर्नुहोस्", en: "Browse" })}
        </Link>
      );
    }
    return (
      <PrimaryButton
        onClick={() => subscribe(id)}
        disabled={busy !== null}
        className="w-full px-3 py-2"
      >
        {busy === id ? "…" : bi({ ne: "लिनुहोस्", en: "Choose" })}
      </PrimaryButton>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader
        title={bi({ ne: "योजना तथा मूल्य", en: "Plans and pricing" })}
        lead={bi({
          ne: "कागजात तयार गर्न र हेर्न सधैँ नि:शुल्क छ। किन्दा मात्र तिर्नुहोस्, वा नियमित आवश्यकता भए योजना लिनुहोस्।",
          en: "Drafting and previewing is always free. Pay for the documents you take, or take a plan if you need them regularly.",
        })}
      />

      {/* Billing period. Annual is preselected because it is the better deal. */}
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <div
          className="inline-flex border border-rule-strong"
          role="group"
          aria-label={bi({ ne: "भुक्तानी अवधि", en: "Billing period" })}
        >
          {(["annual", "monthly"] as BillingPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              aria-pressed={period === p}
              className={`px-4 py-2 font-mono text-[0.72rem] uppercase tracking-wider transition-colors ${
                period === p ? "bg-accent text-white" : "text-ink-2 hover:text-accent"
              }`}
            >
              {p === "annual" ? bi({ ne: "वार्षिक", en: "Annual" }) : bi({ ne: "मासिक", en: "Monthly" })}
            </button>
          ))}
        </div>
        {period === "annual" && (
          <p className="font-mono text-[0.72rem] uppercase tracking-wider text-malachite">
            {bi({
              ne: `वार्षिकमा ${toNepaliDigits(annualSavingPercent("business"))}% सम्म बचत`,
              en: `Save up to ${annualSavingPercent("business")}% annually`,
            })}
          </p>
        )}
      </div>

      {/*
        A comparison table, not three cards.
        Someone on this page is deciding between tiers, and that decision is made on
        the differences. Cards can only list what a tier includes; a row per
        entitlement shows what the cheaper one gives up.
      */}
      {/*
        The table is wider than a phone and scrolls inside its own container, which
        is correct but invisible. Without a hint a mobile reader sees the Free column
        and assumes that is the whole comparison.
      */}
      <p className="mt-10 font-mono text-[0.7rem] uppercase tracking-wider text-ink-3 sm:hidden">
        {bi({ ne: "तुलना हेर्न छेउतिर सार्नुहोस् →", en: "Swipe to compare plans →" })}
      </p>

      <div className="mt-3 overflow-x-auto sm:mt-10">
        <table className="w-full min-w-[42rem] border-collapse text-left">
          <caption className="sr-only">
            {bi({ ne: "योजनाहरूको तुलना", en: "Comparison of plans" })}
          </caption>
          <thead>
            <tr className="border-b-2 border-ink">
              <th scope="col" className="w-[34%] py-4 pr-4 align-bottom">
                <SectionLabel as="p">{bi({ ne: "समावेश", en: "What you get" })}</SectionLabel>
              </th>
              {PLAN_ORDER.map((id) => {
                const plan = PLANS[id];
                const price = planPriceNpr(id, period);
                return (
                  <th key={id} scope="col" className="px-4 py-4 align-bottom">
                    <span className="block font-serif text-xl font-semibold tracking-tight">
                      {bi(plan.name)}
                    </span>
                    <span className="mt-1 block font-serif text-2xl font-semibold tabular-nums">
                      {money(price)}
                    </span>
                    <span className="mt-0.5 block font-mono text-[0.68rem] uppercase tracking-wider text-ink-3">
                      {price === 0
                        ? bi({ ne: "योजना शुल्क छैन", en: "no plan fee" })
                        : period === "annual"
                          ? bi({ ne: "प्रति वर्ष", en: "per year" })
                          : bi({ ne: "प्रति महिना", en: "per month" })}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label.en} className="border-b border-rule">
                <th scope="row" className="py-3.5 pr-4 text-sm font-normal text-ink-2">
                  {bi(row.label)}
                </th>
                {PLAN_ORDER.map((id) => (
                  <td key={id} className="px-4 py-3.5 text-sm tabular-nums">
                    {row.read(PLANS[id].entitlements)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr>
              <td className="py-5 pr-4" />
              {PLAN_ORDER.map((id) => (
                <td key={id} className="px-4 py-5 align-top">
                  <PlanAction id={id} />
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* What a subscriber has left this month. */}
      {sub && sub.planId !== "free" && (
        <Callout tone="good" label={bi({ ne: "यो महिना बाँकी", en: "Remaining this month" })} className="mt-10">
          {bi({ ne: "लिखित प्रश्न", en: "Written questions" })}:{" "}
          <strong className="tabular-nums">{num(sub.questionsRemaining)}</strong>
          {" · "}
          {bi({ ne: "कागजात जाँच", en: "Contract reviews" })}:{" "}
          <strong className="tabular-nums">{num(sub.reviewsRemaining)}</strong>
          <span className="mt-2 block font-mono text-[0.7rem] text-ink-3">
            {bi({
              ne: "मासिक कोटा प्रत्येक महिनाको पहिलो दिन पुन: सुरु हुन्छ।",
              en: "Monthly allowance resets on the first of each month.",
            })}
          </span>
        </Callout>
      )}

      {notice && (
        <Callout tone="caution" className="mt-6">
          {notice}
        </Callout>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Callout tone="caution" label={bi({ ne: "योजनाले के समेट्दैन", en: "What a plan does not cover" })}>
          {bi({
            ne: "प्रत्यक्ष परामर्श, अदालतमा प्रतिनिधित्व, कम्पनी दर्ता र सरकारी दस्तुर योजनामा समावेश छैनन्। ती छुट्टै शुल्कमा उपलब्ध हुन्छन्।",
            en: "Live consultations, representation in court, company registration and government fees are not included in any plan. Those are charged separately.",
          })}
        </Callout>
        <Callout tone="note" label={bi({ ne: "मासिक कोटा नपुगे", en: "If you run out mid-month" })}>
          {bi({
            ne: "कोटा सकिएमा सेवा बन्द हुँदैन। थप विषय प्रति विषय शुल्कमा लिन सकिन्छ।",
            en: "Nothing stops working. Further matters are simply charged per matter at the usual rate.",
          })}
        </Callout>
      </div>

      {!loading && !user && (
        <p className="mt-8 font-mono text-[0.72rem] uppercase tracking-wider text-ink-3">
          {bi({ ne: "योजना लिन लगइन आवश्यक पर्दछ।", en: "You'll be asked to sign in before subscribing." })}
        </p>
      )}
    </div>
  );
}
