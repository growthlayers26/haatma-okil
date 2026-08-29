"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "./language-provider";
import { useAuth } from "./auth-provider";
import { DocumentPreview } from "./document-preview";
import { ExecutionNotice } from "./execution-notice";
import { validate, hasBlockingIssues } from "@/lib/render";
import { formatNpr } from "@/lib/nepal";
import { parseBsString, formatBsShort } from "@/lib/bs-date";
import { saveDocument } from "@/app/actions/documents";
import type { Handoff } from "@/lib/payments/types";
import type { Template, Answers } from "@/lib/types";

/**
 * eSewa takes a signed form POST rather than a redirect, so the browser has to submit
 * a real form. The signature is computed server-side; these fields are opaque here.
 */
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

const ADVOCATE_REVIEW_NPR = 2_500;

type Gateway = "khalti" | "esewa" | "fonepay" | "card";

/** Khalti leads: cleanest API of the three and its sandbox matches production. */
const GATEWAYS: { id: Gateway; label: string; note: { ne: string; en: string } }[] = [
  {
    id: "khalti",
    label: "Khalti",
    note: { ne: "वालेट वा बैंक", en: "Wallet or bank" },
  },
  {
    id: "esewa",
    label: "eSewa",
    note: { ne: "सबैभन्दा धेरै प्रयोग हुने", en: "Widest reach" },
  },
  {
    id: "fonepay",
    label: "Fonepay QR",
    note: { ne: "कुनै पनि बैंक एप", en: "Any connected bank app" },
  },
  {
    id: "card",
    label: "Visa / Mastercard",
    note: { ne: "विदेशबाट भुक्तानी", en: "For payment from abroad" },
  },
];

export function Checkout({
  template,
  answers,
  onBack,
}: {
  template: Template;
  answers: Answers;
  onBack: () => void;
}) {
  const { t, bi, lang } = useLang();
  const { user } = useAuth();
  const router = useRouter();
  const [gateway, setGateway] = useState<Gateway>("khalti");
  const [wantsReview, setWantsReview] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");

  const issues = useMemo(() => validate(template, answers), [template, answers]);
  const blocked = hasBlockingIssues(issues);

  const total = template.priceNpr + (wantsReview ? ADVOCATE_REVIEW_NPR : 0);
  const money = (npr: number) => formatNpr(npr, lang);

  const reviewed = parseBsString(template.review.reviewedOnBs);

  async function pay() {
    setPending(true);
    setNotice("");

    try {
      // Payment is the first point an account is genuinely needed. Everything up to
      // here works anonymously; the draft is already in localStorage, so bouncing
      // through login loses nothing.
      if (!user) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      // Put the answers on the server before leaving for the gateway — the wallet
      // apps take over the browser, and a draft that only exists in this tab may not
      // survive the round trip.
      const saved = await saveDocument({
        templateSlug: template.slug,
        answers,
      });

      // The client says what it's buying, never what it costs. Price is recomputed
      // server-side from the template registry.
      const response = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gateway,
          documentId: saved.ok ? saved.id : undefined,
          item: { type: "document", slug: template.slug, advocateReview: wantsReview },
        }),
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

      setNotice(
        data.message ??
          bi({
            ne: "भुक्तानी सुरु गर्न सकिएन।",
            en: "Could not start the payment.",
          }),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <button
        type="button"
        onClick={onBack}
        className="no-print font-mono text-xs text-ink-3 transition-colors hover:text-accent"
      >
        ← {t("back")}
      </button>

      <h1 className="mt-3 font-serif text-2xl font-semibold tracking-tight">
        {t("reviewAndPay")}
      </h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="border border-rule">
          <div className="no-print flex items-center justify-between border-b border-rule bg-surface-2 px-3 py-2">
            <span className="font-mono text-xs uppercase tracking-wider text-ink-3">
              {t("previewWatermark")}
            </span>
            {reviewed && (
              <span className="font-mono text-[0.7rem] text-malachite">
                ✓ {t("reviewedOn")} {formatBsShort(reviewed, lang)}
              </span>
            )}
          </div>
          <DocumentPreview template={template} answers={answers} mode="preview" />
        </div>

        <aside className="no-print space-y-4 lg:sticky lg:top-20 lg:self-start">
          {blocked && (
            <div className="border-l-2 border-cinnabar bg-surface p-4">
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-cinnabar">
                {t("blockedTitle")}
              </p>
              <p className="mt-1.5 text-sm text-ink-2">{t("blockedBody")}</p>
            </div>
          )}

          <div className="border border-rule bg-surface p-4">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-3">
              {t("orderSummary")}
            </p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span>{bi(template.title)}</span>
                <span className="tabular-nums">{money(template.priceNpr)}</span>
              </div>
              {wantsReview && (
                <div className="flex justify-between gap-3 text-ink-2">
                  <span>{t("addAdvocateReview")}</span>
                  <span className="tabular-nums">{money(ADVOCATE_REVIEW_NPR)}</span>
                </div>
              )}
            </div>
            <div className="mt-3 flex items-baseline justify-between border-t border-dashed border-rule-strong pt-3">
              <span className="font-mono text-xs uppercase tracking-wider text-ink-3">
                {t("total")}
              </span>
              <span className="font-serif text-xl font-semibold tabular-nums">{money(total)}</span>
            </div>
          </div>

          <div className="border border-rule bg-surface p-4">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-3">
              {t("paymentMethod")}
            </p>
            <div className="mt-3 space-y-2">
              {GATEWAYS.map((g) => (
                <label
                  key={g.id}
                  className={`flex cursor-pointer items-center gap-3 border px-3 py-2.5 text-sm transition-colors ${
                    gateway === g.id ? "border-accent bg-accent-soft" : "border-rule-strong"
                  }`}
                >
                  <input
                    type="radio"
                    name="gateway"
                    value={g.id}
                    checked={gateway === g.id}
                    onChange={() => setGateway(g.id)}
                    className="accent-[var(--accent)]"
                  />
                  <span className="font-semibold">{g.label}</span>
                  <span className="ml-auto font-mono text-[0.7rem] text-ink-3">{bi(g.note)}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 border border-rule bg-surface p-4 text-sm">
            <input
              type="checkbox"
              checked={wantsReview}
              onChange={(e) => setWantsReview(e.target.checked)}
              className="mt-1 accent-[var(--accent)]"
            />
            <span>
              <span className="font-semibold">{t("addAdvocateReview")}</span>
              <span className="mt-0.5 block text-ink-2">
                {bi({
                  ne: "फर्मका इजाजतप्राप्त अधिवक्ताले तपाईंको कागजात हेरी सुझाव दिनुहुनेछ।",
                  en: "A licensed advocate at the firm reads your document and comes back with comments.",
                })}
              </span>
            </span>
          </label>

          <button
            type="button"
            onClick={pay}
            disabled={blocked || pending}
            className="w-full bg-accent px-5 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending ? "…" : `${t("payNow")} — ${money(total)}`}
          </button>

          {!user && (
            <p className="text-sm text-ink-3">
              {bi({
                ne: "भुक्तानीअघि लगइन आवश्यक पर्दछ। तपाईंको ड्राफ्ट सुरक्षित रहनेछ।",
                en: "You'll be asked to sign in before paying. Your draft is kept.",
              })}
            </p>
          )}

          {notice && (
            <p className="border-l-2 border-orpiment bg-surface p-3 text-sm text-ink-2" role="status">
              {notice}
            </p>
          )}

          {/*
            Execution requirements appear before payment, never after. Nobody should
            believe a download is an executed instrument. Shared with the finished
            document view, which repeats them at the moment they matter most.
          */}
          <ExecutionNotice template={template} />
        </aside>
      </div>
    </div>
  );
}
