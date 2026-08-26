"use client";

import Link from "next/link";
import { useState } from "react";
import { useLang } from "@/components/language-provider";
import { useAuth } from "@/components/auth-provider";
import {
  createEnvelope,
  recordWetInkSignature,
  completeEnvelope,
  type EnvelopeSummary,
} from "@/app/actions/signing";
import { SIGNING_ROUTES, NO_CLICKWRAP_NOTE, isDigitalSigningAvailable } from "@/lib/signing/ca";
import { getTemplate } from "@/lib/templates";
import { ACTS } from "@/lib/nepal";

type Props = {
  envelopes: EnvelopeSummary[];
  documents: { id: string; templateSlug: string }[];
};

export function SignClient({ envelopes, documents }: Props) {
  const { bi } = useLang();
  const { user, loading } = useAuth();

  const [documentId, setDocumentId] = useState("");
  const [subject, setSubject] = useState("");
  const [names, setNames] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const digitalAvailable = isDigitalSigningAvailable();

  const REASONS: Record<string, string> = {
    not_purchased: bi({
      ne: "हस्ताक्षरका लागि पठाउनुअघि कागजात किन्नुपर्दछ।",
      en: "The document must be purchased before it can go out for signature.",
    }),
    digital_unavailable: bi({
      ne: "विद्युतीय हस्ताक्षर अहिले उपलब्ध छैन।",
      en: "Digital signing is not available yet.",
    }),
    certificate_not_verified: bi({
      ne: "प्रमाणपत्र प्रमाणित नभएकाले पूरा गर्न मिलेन।",
      en: "Cannot complete — a certificate has not been verified.",
    }),
    incomplete: bi({
      ne: "सबै पक्षले हस्ताक्षर गरिसकेका छैनन्।",
      en: "Not everyone has signed yet.",
    }),
    not_pending: bi({ ne: "यो पहिले नै अभिलेख भइसकेको छ।", en: "That was already recorded." }),
  };

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const signatories = names
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          // "Name, Capacity" — capacity optional.
          const [fullName, capacity] = line.split(",").map((p) => p.trim());
          return { fullName, capacity: capacity || undefined };
        });

      const result = await createEnvelope({
        documentId,
        subject,
        method: "wet_ink",
        signatories,
      });

      if (result.ok) {
        setSubject("");
        setNames("");
        setDocumentId("");
      } else {
        setNotice(REASONS[result.reason] ?? bi({ ne: "बनाउन सकिएन।", en: "Could not create it." }));
      }
    } finally {
      setBusy(false);
    }
  }

  async function onRecord(signatoryId: string) {
    const where = window.prompt(
      bi({
        ne: "हस्ताक्षर गरिएको सक्कल प्रति कहाँ राखिएको छ?",
        en: "Where is the signed original held?",
      }) ?? "",
    );
    if (!where) return;

    setBusy(true);
    const result = await recordWetInkSignature(signatoryId, where);
    if (!result.ok) setNotice(REASONS[result.reason] ?? bi({ ne: "सकिएन।", en: "Could not record it." }));
    setBusy(false);
  }

  async function onComplete(id: string) {
    setBusy(true);
    setNotice("");
    const result = await completeEnvelope(id);
    if (!result.ok) setNotice(REASONS[result.reason] ?? bi({ ne: "सकिएन।", en: "Could not complete it." }));
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
        {bi({ ne: "हस्ताक्षर", en: "Signing" })}
      </h1>
      <p className="mt-3 max-w-[64ch] text-lg text-ink-2">
        {bi({
          ne: "कागजातमा कसले हस्ताक्षर गर्नुपर्ने हो सूचीबद्ध गर्नुहोस् र कसले गरिसक्यो भन्ने अभिलेख राख्नुहोस्।",
          en: "List who has to sign a document, and keep a record of who actually has.",
        })}
      </p>

      {/*
        The most important block on the page. A user who has used foreign e-signature
        products will assume click-wrap is missing by accident unless told otherwise.
      */}
      <div className="mt-6 border-l-2 border-cinnabar bg-surface p-5">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-cinnabar">
          {bi({ ne: "किन 'क्लिक गरेर हस्ताक्षर' छैन", en: "Why there is no click-to-sign here" })}
        </p>
        <p className="mt-1.5 max-w-[62ch] text-sm text-ink-2">{bi(NO_CLICKWRAP_NOTE)}</p>
        <p className="mt-2 font-mono text-xs text-ink-3">→ {bi(ACTS.electronic.act)}</p>
      </div>

      {/* What each route actually achieves. */}
      <div className="mt-6 grid gap-px border border-rule bg-rule sm:grid-cols-2">
        {(["wet_ink", "digital_certificate"] as const).map((key) => {
          const route = SIGNING_ROUTES[key];
          const live = key === "wet_ink" ? true : digitalAvailable;
          return (
            <div key={key} className="bg-surface p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-serif text-lg font-semibold tracking-tight">{bi(route.label)}</p>
                <span
                  className={`border px-1.5 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider ${
                    live ? "border-malachite text-malachite" : "border-rule-strong text-ink-3"
                  }`}
                >
                  {live
                    ? bi({ ne: "उपलब्ध", en: "Available" })
                    : bi({ ne: "तयारीमा", en: "Not yet" })}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-ink-2">{bi(route.effect)}</p>
              {!live && (
                <p className="mt-2 font-mono text-xs text-ink-3">
                  {bi({
                    ne: "फर्मले इजाजतप्राप्त प्रमाणीकरण निकाय छनौट गरेपछि उपलब्ध हुनेछ।",
                    en: "Becomes available once the firm selects a licensed certifying authority.",
                  })}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {notice && (
        <p className="mt-6 border-l-2 border-orpiment bg-surface p-3 text-sm text-ink-2" role="status">
          {notice}
        </p>
      )}

      {!loading && !user ? (
        <p className="mt-8 text-ink-2">
          {bi({ ne: "जारी राख्न लगइन गर्नुहोस्।", en: "Sign in to continue." })}{" "}
          <Link href="/login?next=/sign" className="text-accent underline">
            {bi({ ne: "लगइन", en: "Sign in" })}
          </Link>
        </p>
      ) : (
        <>
          {/* Create */}
          <section className="mt-10">
            <h2 className="font-serif text-2xl font-semibold tracking-tight">
              {bi({ ne: "हस्ताक्षरका लागि पठाउनुहोस्", en: "Send a document for signature" })}
            </h2>

            {documents.length === 0 ? (
              <p className="mt-3 border border-dashed border-rule-strong p-5 text-sm text-ink-2">
                {bi({
                  ne: "किनिएको कागजात छैन। हस्ताक्षरका लागि पठाउनुअघि कागजात किन्नुपर्दछ।",
                  en: "No purchased documents yet. A document must be bought before it can go out for signature.",
                })}
              </p>
            ) : (
              <form onSubmit={onCreate} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="doc" className="block text-sm font-semibold">
                    {bi({ ne: "कागजात", en: "Document" })}
                  </label>
                  <select
                    id="doc"
                    required
                    value={documentId}
                    onChange={(e) => setDocumentId(e.target.value)}
                    className="mt-1.5 w-full border border-rule-strong bg-surface px-3 py-2.5 outline-none focus:border-accent"
                  >
                    <option value="">{bi({ ne: "छान्नुहोस्…", en: "Choose…" })}</option>
                    {documents.map((d) => {
                      const t = getTemplate(d.templateSlug);
                      return (
                        <option key={d.id} value={d.id}>
                          {t ? bi(t.title) : d.templateSlug}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold">
                    {bi({ ne: "विषय", en: "Subject" })}
                  </label>
                  <input
                    id="subject"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mt-1.5 w-full border border-rule-strong bg-surface px-3 py-2.5 outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label htmlFor="names" className="block text-sm font-semibold">
                    {bi({ ne: "हस्ताक्षर गर्नुपर्ने व्यक्ति", en: "Who has to sign" })}
                  </label>
                  <textarea
                    id="names"
                    rows={4}
                    required
                    value={names}
                    onChange={(e) => setNames(e.target.value)}
                    placeholder={bi({
                      ne: "प्रत्येक लाइनमा एक जना — नाम, हैसियत\nजस्तै: सीता श्रेष्ठ, सञ्चालक",
                      en: "One per line — name, capacity\ne.g. Sita Shrestha, Director",
                    })}
                    className="mt-1.5 w-full border border-rule-strong bg-surface px-3 py-2.5 font-mono text-sm outline-none focus:border-accent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="bg-accent px-5 py-2.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {busy ? "…" : bi({ ne: "सूची बनाउनुहोस्", en: "Create signing list" })}
                </button>
              </form>
            )}
          </section>

          {/* Envelopes */}
          {envelopes.length > 0 && (
            <section className="mt-10">
              <h2 className="font-serif text-2xl font-semibold tracking-tight">
                {bi({ ne: "चलिरहेका", en: "In progress" })}
              </h2>
              <div className="mt-4 space-y-4">
                {envelopes.map((e) => {
                  const t = e.templateSlug ? getTemplate(e.templateSlug) : null;
                  const allSigned = e.signatories.every((s) => s.status === "signed");
                  return (
                    <div key={e.id} className="border border-rule bg-surface p-5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-serif text-lg font-semibold tracking-tight">{e.subject}</p>
                        <span
                          className={`font-mono text-xs uppercase tracking-wider ${
                            e.status === "completed" ? "text-malachite" : "text-orpiment"
                          }`}
                        >
                          {e.status}
                        </span>
                      </div>
                      <p className="mt-0.5 font-mono text-xs text-ink-3">
                        {t ? bi(t.title) : e.templateSlug} · {bi(SIGNING_ROUTES[e.method].label)}
                      </p>

                      <ul className="mt-3 grid gap-px border border-rule bg-rule">
                        {e.signatories.map((s) => (
                          <li key={s.id} className="flex flex-wrap items-center gap-3 bg-surface p-3">
                            <span className="min-w-0 flex-1 text-sm">
                              {s.fullName}
                              {s.capacity && (
                                <span className="text-ink-3"> · {s.capacity}</span>
                              )}
                            </span>
                            {s.status === "signed" ? (
                              <span className="font-mono text-xs text-malachite">
                                ✓ {bi({ ne: "हस्ताक्षर भयो", en: "Signed" })}
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => onRecord(s.id)}
                                className="border border-rule-strong px-2.5 py-1 text-xs font-semibold text-ink-2 transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
                              >
                                {bi({ ne: "हस्ताक्षर अभिलेख गर्नुहोस्", en: "Record signature" })}
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>

                      {allSigned && e.status !== "completed" && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onComplete(e.id)}
                          className="mt-3 bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                        >
                          {bi({ ne: "पूरा भएको जनाउनुहोस्", en: "Mark complete" })}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
