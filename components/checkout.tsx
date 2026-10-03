"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "./language-provider";
import { useAuth } from "./auth-provider";
import { DocumentPreview } from "./document-preview";
import { ExecutionNotice } from "./execution-notice";
import { validate, hasBlockingIssues } from "@/lib/render";
import { formatNpr } from "@/lib/nepal";
import { ADVOCATE_REVIEW_NPR } from "@/lib/payments/catalogue";
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

/**
 * What the shop accepts, shown so nobody is surprised by it — not chosen from.
 *
 * Payment methods are picked on Bagisto's checkout, the next screen, from whatever the
 * firm has enabled there. This list used to be a set of radio buttons whose answer was
 * thrown away, led with Khalti (which Bagisto has no extension for, so the default was
 * a method that does not exist) and made people choose twice.
 */
const ACCEPTED: { label: string; note: { ne: string; en: string } }[] = [
  { label: "eSewa", note: { ne: "सबैभन्दा धेरै प्रयोग हुने", en: "Widest reach" } },
  { label: "Fonepay QR", note: { ne: "कुनै पनि बैंक एप", en: "Any connected bank app" } },
  { label: "Visa / Mastercard", note: { ne: "विदेशबाट भुक्तानी", en: "For payment from abroad" } },
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
  const [wantsReview, setWantsReview] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");

  const issues = useMemo(() => validate(template, answers), [template, answers]);
  const blocked = hasBlockingIssues(issues);

  const total = template.priceNpr + (wantsReview ? ADVOCATE_REVIEW_NPR : 0);
  const money = (npr: number) => formatNpr(npr, lang);

  const reviewed = parseBsString(template.review.reviewedOnBs);

  /*
   * Pressing Back from the payment screen restores this page from the browser's memory
   * exactly as it was left — which is with the button disabled and showing "…". Nothing
   * re-runs, so nothing would ever re-enable it.
   */
  useEffect(() => {
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) setPending(false);
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  // `checkout=1` is what makes the wizard reopen on this screen rather than step one.
  const signInThenReturn = () =>
    `/login?next=${encodeURIComponent(`${window.location.pathname}?checkout=1`)}`;

  async function pay() {
    setPending(true);
    setNotice("");

    // Once the browser is on its way somewhere else the button has to stay disabled.
    // Re-enabling it mid-navigation invites a second press, and a second press mints a
    // second hand-off for the same purchase.
    let leaving = false;

    try {
      // Payment is the first point an account is genuinely needed. Everything up to
      // here works anonymously; the draft is already in localStorage, so bouncing
      // through login loses nothing.
      if (!user) {
        leaving = true;
        router.push(signInThenReturn());
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
          documentId: saved.ok ? saved.id : undefined,
          item: { type: "document", slug: template.slug, advocateReview: wantsReview },
        }),
      });

      // A gateway timeout or an error page is not JSON; that is a failure to report,
      // not a reason for the click to do nothing at all.
      const data = (await response.json().catch(() => null)) as {
        handoff?: Handoff;
        message?: string;
        requiresAuth?: boolean;
      } | null;

      if (data?.requiresAuth) {
        leaving = true;
        router.push(signInThenReturn());
        return;
      }

      if (data?.handoff?.mode === "redirect") {
        leaving = true;
        window.location.href = data.handoff.url;
        return;
      }

      if (data?.handoff?.mode === "form") {
        leaving = true;
        submitGatewayForm(data.handoff.action, data.handoff.fields);
        return;
      }

      setNotice(
        data?.message ??
          bi({
            ne: "भुक्तानी सुरु गर्न सकिएन।",
            en: "Could not start the payment.",
          }),
      );
    } catch {
      // saveDocument is a server action and throws when the database is unreachable;
      // fetch throws when the network is. Either way the person was left looking at a
      // button that came back to life with no word on why.
      setNotice(
        bi({
          ne: "भुक्तानी सुरु गर्न सकिएन। इन्टरनेट जाँचेर फेरि प्रयास गर्नुहोस्।",
          en: "Could not start the payment. Check your connection and try again.",
        }),
      );
    } finally {
      if (!leaving) setPending(false);
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
              <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-cinnabar">
                {t("blockedTitle")}
              </p>
              <p className="mt-1.5 text-sm text-ink-2">{t("blockedBody")}</p>
            </div>
          )}

          <div className="border border-rule bg-surface p-4">
            <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-ink-3">
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
            <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-ink-3">
              {t("paymentMethod")}
            </p>
            <ul className="mt-3 space-y-2">
              {ACCEPTED.map((method) => (
                <li
                  key={method.label}
                  className="flex items-center gap-3 border border-rule-strong px-3 py-2.5 text-sm"
                >
                  <span className="font-semibold">{method.label}</span>
                  <span className="ml-auto font-mono text-[0.7rem] text-ink-3">
                    {bi(method.note)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-ink-3">
              {bi({
                ne: "भुक्तानी विधि अर्को पृष्ठमा छान्नुहुनेछ।",
                en: "You'll pick one on the next screen.",
              })}
            </p>
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
