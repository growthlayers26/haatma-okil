"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLang } from "@/components/language-provider";
import { useAuth } from "@/components/auth-provider";
import { TEMPLATES, getTemplate } from "@/lib/templates";
import { completionPercent } from "@/lib/render";
import { toNepaliDigits, formatNpr } from "@/lib/nepal";
import { formatBsShort, parseBsString, bsToGregorianLabel, fromBs } from "@/lib/bs-date";
import { usePersistentMap } from "@/lib/use-persistent-state";
import { draftKey } from "@/components/wizard";
import {
  listDocuments,
  claimLocalDrafts,
  documentCreditsAvailable,
  releaseDocument,
  type SavedDocument,
} from "@/app/actions/documents";
import { listMyEnquiries, type ClientEnquiry } from "@/app/actions/enquiries";
import { SERVICES, AREAS_OF_LAW } from "@/lib/services";
import { PageHeader, SectionLabel, Callout, Rows, Empty, type Tone } from "@/components/ui";
import { FIRM } from "@/lib/firm";
import type { Answers, Bilingual } from "@/lib/types";

// Stable across renders — TEMPLATES is a module constant.
const DRAFT_KEYS = TEMPLATES.map((t) => draftKey(t.slug));
const EMPTY_ANSWERS: Answers = {};

/**
 * Compliance deadlines are the reason to come back — documents alone don't retain.
 * REVIEW: illustrative until the firm supplies the authoritative filing calendar.
 */
const DEADLINES = [
  { bs: "2083-05-25", label: { ne: "मूल्य अभिवृद्धि कर विवरण", en: "VAT return" } },
  { bs: "2083-06-15", label: { ne: "कम्पनी रजिस्ट्रारमा वार्षिक विवरण", en: "Annual filing at OCR" } },
  { bs: "2083-07-10", label: { ne: "सामाजिक सुरक्षा कोष योगदान", en: "Social Security Fund contribution" } },
];

/** A draft this close to done is worth finishing rather than restarting. */
const NEARLY_DONE = 60;

/** How far ahead a filing date counts as something to act on now. */
const DEADLINE_HORIZON_DAYS = 30;

type Attention = {
  id: string;
  tone: Tone;
  label: Bilingual;
  detail: Bilingual;
  href: string;
  action: Bilingual;
};

function daysUntil(bsString: string): number | null {
  const bs = parseBsString(bsString);
  if (!bs) return null;
  const due = fromBs(bs).getTime();
  return Math.ceil((due - Date.now()) / 86_400_000);
}

export default function DashboardPage() {
  const { t, bi, lang } = useLang();
  const { user, loading } = useAuth();

  const local = usePersistentMap<Answers>(DRAFT_KEYS, EMPTY_ANSWERS);
  const [saved, setSaved] = useState<SavedDocument[]>([]);
  const [enquiries, setEnquiries] = useState<ClientEnquiry[]>([]);
  // Paid document credits not yet spent on a draft.
  const [credits, setCredits] = useState(0);
  const [releasing, setReleasing] = useState<string | null>(null);
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
      const [docs, enq, held] = await Promise.all([
        listDocuments(),
        listMyEnquiries(),
        documentCreditsAvailable(),
      ]);
      setSaved(docs);
      setEnquiries(enq);
      setCredits(held);
    }

    void sync();
    // `local` is intentionally excluded: claiming runs once per session, and
    // re-running it on every keystroke elsewhere would spam the server.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /*
   * Spend one paid credit on this draft.
   *
   * Payment happens in the shop, which cannot carry a draft id through its cart, so
   * the credit arrives unattached and the customer chooses what it releases.
   */
  async function applyCredit(documentId: string) {
    setReleasing(documentId);
    const result = await releaseDocument(documentId);
    if (result.ok) {
      const [docs, held] = await Promise.all([listDocuments(), documentCreditsAvailable()]);
      setSaved(docs);
      setCredits(held);
    }
    setReleasing(null);
  }

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

  /*
   * What actually needs the user.
   *
   * The dashboard used to open with a list of everything they owned, which answers a
   * question nobody arrives with. A returning user has one: is there anything I have
   * to do? Everything below is derived, so the list is empty when it should be —
   * and an empty list is a useful answer rather than a broken page.
   */
  const attention = useMemo<Attention[]>(() => {
    const items: Attention[] = [];

    for (const e of enquiries) {
      if (e.status !== "answered" || !e.answer) continue;
      items.push({
        id: `answer-${e.id}`,
        tone: "good",
        label: { ne: "अधिवक्ताको जवाफ आयो", en: "An advocate has answered" },
        detail: {
          ne: `${SERVICES[e.kind].title.ne}${e.advocate ? ` · ${e.advocate.fullName.ne}` : ""}`,
          en: `${SERVICES[e.kind].title.en}${e.advocate ? ` · ${e.advocate.fullName.en}` : ""}`,
        },
        href: "#matters",
        action: { ne: "पढ्नुहोस्", en: "Read it" },
      });
    }

    for (const d of documents) {
      if (d.status !== "draft" || d.percent < NEARLY_DONE || d.percent >= 100) continue;
      items.push({
        id: `draft-${d.key}`,
        tone: "accent",
        label: { ne: "अधुरो कागजात", en: "A document is nearly finished" },
        detail: {
          ne: `${d.template.title.ne}, ${toNepaliDigits(d.percent)}% पूरा`,
          en: `${d.template.title.en}, ${d.percent}% complete`,
        },
        href: `/create/${d.template.slug}`,
        action: { ne: "पूरा गर्नुहोस्", en: "Finish it" },
      });
    }

    for (const dl of DEADLINES) {
      const days = daysUntil(dl.bs);
      if (days === null || days < 0 || days > DEADLINE_HORIZON_DAYS) continue;
      items.push({
        id: `deadline-${dl.bs}`,
        tone: days <= 7 ? "danger" : "caution",
        label: dl.label,
        detail: {
          ne: `${toNepaliDigits(days)} दिन बाँकी`,
          en: days === 0 ? "Due today" : `${days} days left`,
        },
        href: "/advocate",
        action: { ne: "सोध्नुहोस्", en: "Ask about it" },
      });
    }

    return items;
  }, [enquiries, documents]);

  const num = (n: number) => (lang === "ne" ? toNepaliDigits(n) : String(n));

  const TONE_BORDER: Record<Tone, string> = {
    note: "border-rule-strong",
    accent: "border-accent",
    caution: "border-orpiment",
    danger: "border-cinnabar",
    good: "border-malachite",
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader
        title={t("navDashboard")}
        aside={
          <Link
            href="/templates"
            className="bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            + {bi({ ne: "नयाँ कागजात", en: "New document" })}
          </Link>
        }
      />

      {!loading && !user && (
        <Callout tone="caution" className="mt-6">
          {bi({
            ne: "तपाईंका ड्राफ्ट यही ब्राउजरमा मात्र सुरक्षित छन्। लगइन गरेपछि ती तपाईंको खातामा सर्नेछन्।",
            en: "Your drafts live in this browser only. Sign in and they move to your account, reachable from any device.",
          })}{" "}
          <Link href="/login?next=/dashboard" className="text-accent underline">
            {bi({ ne: "लगइन", en: "Sign in" })}
          </Link>
        </Callout>
      )}

      {/* What needs you — the question a returning user actually arrives with. */}
      <section className="mt-10">
        <SectionLabel>{bi({ ne: "ध्यान दिनुपर्ने", en: "Needs you" })}</SectionLabel>
        {attention.length === 0 ? (
          <p className="mt-3 border-l-2 border-rule-strong bg-surface p-5 text-sm text-ink-2">
            {bi({
              ne: "अहिले केही पनि बाँकी छैन।",
              en: "Nothing needs you right now.",
            })}
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {attention.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-l-2 bg-surface p-4 transition-colors hover:bg-accent-soft ${TONE_BORDER[item.tone]}`}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{bi(item.label)}</span>
                  <span className="mt-0.5 block font-mono text-[0.7rem] text-ink-3">
                    {bi(item.detail)}
                  </span>
                </span>
                <span className="flex-none font-mono text-[0.7rem] uppercase tracking-wider text-accent">
                  {bi(item.action)} →
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_18rem] lg:gap-14">
        <div>
          <SectionLabel>{bi({ ne: "मेरा कागजात", en: "My documents" })}</SectionLabel>

          {/*
            A paid credit that has not been spent yet.

            Said plainly because the alternative is a customer who has paid, sees
            nothing different, and concludes the payment failed.
          */}
          {user && credits > 0 && (
            <div className="mt-3">
              <Callout tone="good">
                {bi({
                  ne: `तपाईंसँग ${num(credits)} भुक्तानी भएको कागजात क्रेडिट छ। तल कुनै ड्राफ्टमा प्रयोग गर्नुहोस्।`,
                  en: `You have ${credits} paid document ${credits === 1 ? "credit" : "credits"}. Apply one to any draft below to get the final copy without the watermark.`,
                })}
              </Callout>
            </div>
          )}

          {documents.length === 0 ? (
            <div className="mt-3">
              <Empty>
                {bi({
                  ne: "अहिलेसम्म कुनै कागजात सुरु गरिएको छैन।",
                  en: "You haven't started a document yet.",
                })}
              </Empty>
            </div>
          ) : (
            <div className="mt-3">
              <Rows>
                {documents.map((doc) => (
                  <div key={doc.key} className="bg-surface">
                    <Link
                      /*
                       * A purchased document goes to its finished, unwatermarked copy;
                       * a draft goes back to the wizard.
                       */
                      href={
                        doc.status === "purchased"
                          ? `/documents/${doc.key}`
                          : `/create/${doc.template.slug}`
                      }
                      className="group flex flex-wrap items-baseline gap-3 p-4 transition-colors hover:bg-accent-soft"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-serif text-lg font-semibold tracking-tight group-hover:text-accent">
                          {bi(doc.template.title)}
                        </p>
                        <p className="mt-0.5 font-mono text-[0.7rem] leading-tight text-ink-3">
                          {bi(doc.template.governingAct.act)} {bi(doc.template.governingAct.section)}
                        </p>
                      </div>
                      <span
                        className={`font-mono text-[0.7rem] uppercase tracking-wider ${
                          doc.status === "purchased" ? "text-malachite" : "text-orpiment"
                        }`}
                      >
                        {doc.status === "purchased"
                          ? bi({ ne: "खरिद गरिएको", en: "Purchased" })
                          : `${bi({ ne: "ड्राफ्ट", en: "Draft" })} · ${num(doc.percent)}%`}
                      </span>
                    </Link>

                    {/*
                      Offered only where it can actually be spent. Outside the Link
                      because a button nested in an anchor is not a real control.
                    */}
                    {user && credits > 0 && doc.status === "draft" && (
                      <div className="border-t border-rule px-4 py-3">
                        <button
                          type="button"
                          onClick={() => void applyCredit(doc.key)}
                          disabled={releasing !== null}
                          className="font-mono text-[0.7rem] uppercase tracking-wider text-accent underline underline-offset-4 disabled:opacity-40"
                        >
                          {releasing === doc.key
                            ? "…"
                            : bi({
                                ne: "भुक्तानी भएको क्रेडिट यसमा प्रयोग गर्नुहोस्",
                                en: "Use a paid credit on this document",
                              })}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </Rows>
            </div>
          )}

          {enquiries.length > 0 && (
            <section id="matters" className="mt-10 scroll-mt-24">
              <SectionLabel>{bi({ ne: "अधिवक्तासँगका विषय", en: "Matters with an advocate" })}</SectionLabel>
              <div className="mt-3">
                <Rows>
                  {enquiries.map((e) => (
                    <div key={e.id} className="bg-surface p-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-serif text-lg font-semibold tracking-tight">
                          {bi(SERVICES[e.kind].title)}
                        </p>
                        <span
                          className={`font-mono text-[0.7rem] uppercase tracking-wider ${
                            e.status === "answered"
                              ? "text-malachite"
                              : e.status === "declined"
                                ? "text-cinnabar"
                                : "text-orpiment"
                          }`}
                        >
                          {e.status}
                        </span>
                      </div>
                      <p className="mt-0.5 font-mono text-[0.7rem] text-ink-3">
                        {bi(
                          AREAS_OF_LAW.find((a) => a.id === e.areaOfLaw)?.label ?? {
                            ne: e.areaOfLaw,
                            en: e.areaOfLaw,
                          },
                        )}
                        {e.advocate ? ` · ${e.advocate.fullName[lang]}` : ""}
                      </p>
                      {e.answer && (
                        <p className="mt-3 max-w-[68ch] whitespace-pre-wrap border-t border-dashed border-rule-strong pt-3 text-[0.95rem] leading-relaxed text-ink-2">
                          {e.answer}
                        </p>
                      )}
                    </div>
                  ))}
                </Rows>
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <div>
            <SectionLabel as="h3">
              {bi({ ne: "अनुपालन क्यालेन्डर", en: "Compliance calendar" })}
            </SectionLabel>
            <ul className="mt-3 space-y-3">
              {DEADLINES.map((d) => {
                const bs = parseBsString(d.bs);
                const days = daysUntil(d.bs);
                const near = days !== null && days >= 0 && days <= DEADLINE_HORIZON_DAYS;
                return (
                  <li
                    key={d.bs}
                    className={`border-l-2 pl-3 ${near ? "border-orpiment" : "border-rule-strong"}`}
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

          {/* The escalation to real counsel is the firm's actual product. */}
          <div className="border-t border-rule pt-5">
            <SectionLabel as="h3">{bi({ ne: "अधिवक्ता डेस्क", en: "Advocate desk" })}</SectionLabel>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              {bi({
                ne: `फर्मका ${toNepaliDigits(FIRM.advocateCount)} जना इजाजतप्राप्त अधिवक्तामध्ये एक जनाले हेर्नुहुनेछ।`,
                en: `One of the firm's ${FIRM.advocateCount} licensed advocates will take it.`,
              })}
            </p>
            <p className="mt-2 font-mono text-[0.7rem] text-ink-3">
              {bi({ ne: "लिखित प्रश्न", en: "Written question" })} ·{" "}
              {formatNpr(SERVICES.question.priceNpr, lang)}
            </p>
            <Link
              href="/advocate"
              className="mt-3 block border border-accent px-3 py-2 text-center text-sm font-semibold text-accent transition-colors hover:bg-accent-soft"
            >
              {bi({ ne: "प्रश्न सोध्नुहोस्", en: "Ask a question" })}
            </Link>
          </div>

          <Callout tone="caution" label={bi({ ne: "कानुन परिवर्तन सूचना", en: "Amendment alerts" })}>
            {bi({
              ne: "तपाईंको कागजातसँग सम्बन्धित ऐन संशोधन भएमा हामी सूचना दिनेछौं र नयाँ संस्करण नि:शुल्क बनाउन पाइनेछ।",
              en: "When a statute behind one of your documents is amended, we tell you and you can regenerate the current version at no cost.",
            })}
          </Callout>
        </aside>
      </div>
    </div>
  );
}
