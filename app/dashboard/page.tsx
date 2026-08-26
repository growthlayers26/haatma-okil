"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLang } from "@/components/language-provider";
import { useAuth } from "@/components/auth-provider";
import { TEMPLATES, getTemplate } from "@/lib/templates";
import { completionPercent } from "@/lib/render";
import { toNepaliDigits, formatNpr } from "@/lib/nepal";
import { formatBsShort, parseBsString, bsToGregorianLabel } from "@/lib/bs-date";
import { usePersistentMap } from "@/lib/use-persistent-state";
import { draftKey } from "@/components/wizard";
import { listDocuments, claimLocalDrafts, type SavedDocument } from "@/app/actions/documents";
import { listMyEnquiries, type ClientEnquiry } from "@/app/actions/enquiries";
import { SERVICES, AREAS_OF_LAW } from "@/lib/services";
import type { Answers } from "@/lib/types";

// Stable across renders — TEMPLATES is a module constant.
const DRAFT_KEYS = TEMPLATES.map((t) => draftKey(t.slug));
const EMPTY_ANSWERS: Answers = {};

/**
 * Compliance deadlines are the reason to come back — documents alone don't retain.
 * These are illustrative until the firm supplies the authoritative filing calendar.
 */
const DEADLINES = [
  { bs: "2083-05-25", label: { ne: "मूल्य अभिवृद्धि कर विवरण", en: "VAT return" }, urgent: true },
  { bs: "2083-06-15", label: { ne: "कम्पनी रजिस्ट्रारमा वार्षिक विवरण", en: "Annual filing at OCR" }, urgent: false },
  { bs: "2083-07-10", label: { ne: "सामाजिक सुरक्षा कोष योगदान", en: "Social Security Fund contribution" }, urgent: false },
];

export default function DashboardPage() {
  const { t, bi, lang } = useLang();
  const { user, loading } = useAuth();

  const local = usePersistentMap<Answers>(DRAFT_KEYS, EMPTY_ANSWERS);
  const [saved, setSaved] = useState<SavedDocument[]>([]);
  const [enquiries, setEnquiries] = useState<ClientEnquiry[]>([]);
  const claimedRef = useRef(false);

  /*
   * On first sign-in, move anything drafted anonymously onto the account, then read
   * back the server copy. Without this a user loses work simply by logging in, which
   * is exactly the moment they expect their work to become safe.
   */
  useEffect(() => {
    if (!user) return;

    const pending = TEMPLATES.map((template) => ({
      templateSlug: template.slug,
      answers: local[draftKey(template.slug)] ?? {},
    })).filter((d) => Object.keys(d.answers).length > 0);

    async function sync() {
      if (!claimedRef.current) {
        claimedRef.current = true;
        if (pending.length > 0) await claimLocalDrafts(pending);
      }
      const [docs, enq] = await Promise.all([listDocuments(), listMyEnquiries()]);
      setSaved(docs);
      setEnquiries(enq);
    }

    void sync();
    // `local` is intentionally excluded: claiming runs once per session, and
    // re-running it on every keystroke elsewhere would spam the server.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const localDrafts = useMemo(
    () =>
      TEMPLATES.map((template) => ({ template, answers: local[draftKey(template.slug)] }))
        .filter((d) => d.answers && Object.keys(d.answers).length > 0)
        .map((d) => ({
          key: d.template.slug,
          template: d.template,
          percent: completionPercent(d.template, d.answers!),
          status: "draft" as const,
        })),
    [local],
  );

  // Signed in: the server copy is authoritative. Signed out: whatever is in this browser.
  const documents = useMemo(() => {
    if (!user) return localDrafts;

    const fromServer = saved
      .map((doc) => {
        const template = getTemplate(doc.templateSlug);
        if (!template) return null;
        return {
          key: doc.id,
          template,
          percent: completionPercent(template, doc.answers),
          status: doc.status,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    const held = new Set(fromServer.map((d) => d.template.slug));
    return [...fromServer, ...localDrafts.filter((d) => !held.has(d.template.slug))];
  }, [user, saved, localDrafts]);

  const num = (n: number) => (lang === "ne" ? toNepaliDigits(n) : String(n));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold tracking-tight">{t("navDashboard")}</h1>

      {!loading && !user && (
        <p className="mt-3 max-w-[62ch] border-l-2 border-orpiment bg-surface p-4 text-sm text-ink-2">
          {bi({
            ne: "तपाईंका ड्राफ्ट यही ब्राउजरमा मात्र सुरक्षित छन्। लगइन गरेपछि ती तपाईंको खातामा सर्नेछन् र अन्य यन्त्रबाट पनि पहुँच हुनेछ।",
            en: "Your drafts live in this browser only. Sign in and they move to your account, reachable from any device.",
          })}{" "}
          <Link href="/login?next=/dashboard" className="text-accent underline">
            {bi({ ne: "लगइन", en: "Sign in" })}
          </Link>
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <section>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.1em] text-ink-3">
              {bi({ ne: "मेरा कागजात", en: "My documents" })}
            </h2>
            <Link
              href="/templates"
              className="bg-accent px-3 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              + {bi({ ne: "नयाँ", en: "New" })}
            </Link>
          </div>

          {documents.length === 0 ? (
            <p className="mt-4 border border-dashed border-rule-strong p-6 text-sm text-ink-2">
              {bi({
                ne: "अहिलेसम्म कुनै कागजात सुरु गरिएको छैन।",
                en: "You haven't started a document yet.",
              })}
            </p>
          ) : (
            <div className="mt-4 grid gap-px border border-rule bg-rule">
              {documents.map((doc) => (
                <Link
                  key={doc.key}
                  href={`/create/${doc.template.slug}`}
                  className="group flex flex-wrap items-center gap-3 bg-surface p-4 transition-colors hover:bg-accent-soft"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-base font-semibold tracking-tight group-hover:text-accent">
                      {bi(doc.template.title)}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-ink-3">
                      {bi(doc.template.governingAct.act)} {bi(doc.template.governingAct.section)}
                    </p>
                  </div>
                  <span
                    className={`font-mono text-xs ${
                      doc.status === "purchased" ? "text-malachite" : "text-orpiment"
                    }`}
                  >
                    {doc.status === "purchased"
                      ? bi({ ne: "खरिद गरिएको", en: "PURCHASED" })
                      : `${bi({ ne: "ड्राफ्ट", en: "DRAFT" })} · ${num(doc.percent)}%`}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {/* Matters with the firm's advocates. */}
          {enquiries.length > 0 && (
            <>
              <h2 className="mt-8 font-mono text-xs font-semibold uppercase tracking-[0.1em] text-ink-3">
                {bi({ ne: "अधिवक्तासँगका विषय", en: "Matters with an advocate" })}
              </h2>
              <div className="mt-3 grid gap-px border border-rule bg-rule">
                {enquiries.map((e) => (
                  <div key={e.id} className="bg-surface p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-semibold">{bi(SERVICES[e.kind].title)}</p>
                      <span
                        className={`font-mono text-xs ${
                          e.status === "answered"
                            ? "text-malachite"
                            : e.status === "declined"
                              ? "text-cinnabar"
                              : "text-orpiment"
                        }`}
                      >
                        {e.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-0.5 font-mono text-xs text-ink-3">
                      {bi(AREAS_OF_LAW.find((a) => a.id === e.areaOfLaw)?.label ?? { ne: e.areaOfLaw, en: e.areaOfLaw })}
                      {e.advocate ? ` · ${e.advocate.fullName[lang]}` : ""}
                    </p>
                    {e.answer && <p className="mt-2 text-sm text-ink-2">{e.answer}</p>}
                  </div>
                ))}
              </div>
            </>
          )}

          {/*
            Amendment alerts: everyone holding an affected document is told and can
            regenerate free. Cheap to run, and the strongest proof the templates are
            actually maintained.
          */}
          <div className="mt-8 border-l-2 border-orpiment bg-surface p-4">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-orpiment">
              {bi({ ne: "कानुन परिवर्तन सूचना", en: "Amendment alerts" })}
            </p>
            <p className="mt-1.5 max-w-[58ch] text-sm text-ink-2">
              {bi({
                ne: "तपाईंको कागजातसँग सम्बन्धित ऐन संशोधन भएमा हामी सूचना दिनेछौं र नयाँ संस्करण नि:शुल्क बनाउन पाइनेछ।",
                en: "When a statute behind one of your documents is amended, we tell you and you can regenerate the current version at no cost.",
              })}
            </p>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="border border-rule bg-surface p-4">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-3">
              {bi({ ne: "अनुपालन क्यालेन्डर", en: "Compliance calendar" })}
            </p>
            <ul className="mt-3 space-y-2">
              {DEADLINES.map((d) => {
                const bs = parseBsString(d.bs);
                return (
                  <li
                    key={d.bs}
                    className={`border-l-2 pl-3 ${d.urgent ? "border-cinnabar" : "border-rule-strong"}`}
                  >
                    <p className="text-sm">{bi(d.label)}</p>
                    <p className="font-mono text-[0.7rem] tabular-nums text-ink-3">
                      {bs ? formatBsShort(bs, lang) : d.bs}
                      {bs && <span className="ml-1.5 opacity-70">({bsToGregorianLabel(bs)})</span>}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* The escalation to real counsel is the firm's actual product — always one click. */}
          <div className="border border-rule bg-surface p-4">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-3">
              {bi({ ne: "अधिवक्ता डेस्क", en: "Advocate desk" })}
            </p>
            <p className="mt-1.5 text-sm text-ink-2">
              {bi({
                ne: "फर्मका दुई जना इजाजतप्राप्त अधिवक्तामध्ये एक जनाले हेर्नुहुनेछ।",
                en: "One of the firm's two licensed advocates will take it.",
              })}
            </p>
            <p className="mt-2 font-mono text-xs text-ink-3">
              {bi({ ne: "लिखित प्रश्न", en: "Written question" })} · {formatNpr(SERVICES.question.priceNpr, lang)}
            </p>
            <Link
              href="/advocate"
              className="mt-3 block border border-accent px-3 py-2 text-center text-sm font-semibold text-accent transition-colors hover:bg-accent-soft"
            >
              {bi({ ne: "प्रश्न सोध्नुहोस्", en: "Ask a question" })}
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
