"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useLang } from "@/components/language-provider";
import { useAuth } from "@/components/auth-provider";
import { listAdvocates, screenConflict, submitEnquiryDetail, type Advocate } from "@/app/actions/enquiries";
import { SERVICES, AREAS_OF_LAW, type ServiceId } from "@/lib/services";
import { formatNpr } from "@/lib/nepal";

type Stage = "intake" | "detail" | "done" | "conflict";

export default function AdvocatePage() {
  const { bi, lang } = useLang();
  const { user, loading } = useAuth();

  const [advocates, setAdvocates] = useState<Advocate[]>([]);
  const [stage, setStage] = useState<Stage>("intake");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [kind, setKind] = useState<ServiceId>("question");
  const [areaOfLaw, setAreaOfLaw] = useState("employment");
  const [opposingParty, setOpposingParty] = useState("");
  const [question, setQuestion] = useState("");

  const [enquiryId, setEnquiryId] = useState("");
  const [assigned, setAssigned] = useState<Advocate | null>(null);

  useEffect(() => {
    listAdvocates().then(setAdvocates);
  }, []);

  const service = SERVICES[kind];
  const money = (n: number) => formatNpr(n, lang);

  async function onScreen(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const result = await screenConflict({ areaOfLaw, opposingParty, kind });
    setBusy(false);

    if (result.cleared) {
      setEnquiryId(result.enquiryId);
      setAssigned(result.advocate);
      setStage("detail");
      return;
    }

    if (result.reason === "conflict") {
      setStage("conflict");
      return;
    }
    setError(
      result.reason === "unauthenticated"
        ? bi({ ne: "कृपया पहिले लगइन गर्नुहोस्।", en: "Please sign in first." })
        : bi({
            ne: "अधिवक्ता डेस्क अहिले उपलब्ध छैन।",
            en: "The advocate desk is not available in this environment.",
          }),
    );
  }

  async function onSubmitDetail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const result = await submitEnquiryDetail({ enquiryId, question });
    setBusy(false);

    if (result.ok) setStage("done");
    else setError(bi({ ne: "पठाउन सकिएन।", en: "Could not submit. Please try again." }));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
        {bi({ ne: "अधिवक्ता डेस्क", en: "Advocate desk" })}
      </h1>
      <p className="mt-2 max-w-[62ch] text-ink-2">
        {bi({
          ne: "फर्ममा दुई जना इजाजतप्राप्त अधिवक्ता हुनुहुन्छ। तपाईंको विषय एक जनालाई जिम्मा दिइनेछ।",
          en: "The firm has two licensed advocates. Your matter is assigned to one of them.",
        })}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        {/* ---------------- intake ---------------- */}
        <section>
          {stage === "conflict" ? (
            <div className="border-l-2 border-cinnabar bg-surface p-6">
              <h2 className="font-serif text-xl font-semibold">
                {bi({ ne: "यो विषय लिन मिल्दैन", en: "We cannot take this matter" })}
              </h2>
              <p className="mt-2 max-w-[58ch] text-sm text-ink-2">
                {bi({
                  ne: "तपाईंले उल्लेख गर्नुभएको विपक्षी पक्ष फर्मको विद्यमान ग्राहकसँग मिल्न आएकाले स्वार्थ बाझिन सक्दछ। यस्तो अवस्थामा फर्मले यो विषय लिन मिल्दैन। कृपया अर्को अधिवक्तासँग सम्पर्क गर्नुहोस्।",
                  en: "The opposing party you named appears to be an existing client of the firm, which creates a conflict of interest. We cannot act for you in this matter and recommend you instruct another advocate.",
                })}
              </p>
              <p className="mt-3 font-mono text-xs text-ink-3">
                {bi({
                  ne: "तपाईंले विषयको विवरण दिनुभएको छैन र हामीले केही अभिलेख राखेका छैनौं।",
                  en: "You did not describe the matter, and no detail of it has been recorded.",
                })}
              </p>
            </div>
          ) : stage === "done" ? (
            <div className="border-l-2 border-malachite bg-surface p-6">
              <h2 className="font-serif text-xl font-semibold">
                {bi({ ne: "प्रश्न पठाइयो", en: "Enquiry submitted" })}
              </h2>
              <p className="mt-2 text-sm text-ink-2">
                {bi(service.turnaround)}
                {assigned ? ` · ${assigned.fullName[lang]}` : ""}
              </p>
              <Link href="/dashboard" className="mt-4 inline-block text-accent underline">
                {bi({ ne: "मेरो खातामा हेर्नुहोस्", en: "View in your dashboard" })}
              </Link>
            </div>
          ) : stage === "detail" ? (
            <form onSubmit={onSubmitDetail} className="space-y-5">
              <div className="border-l-2 border-malachite bg-surface p-4">
                <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-malachite">
                  ✓ {bi({ ne: "स्वार्थ बाझिने अवस्था छैन", en: "Conflict check cleared" })}
                </p>
                {assigned && (
                  <p className="mt-1.5 text-sm text-ink-2">
                    {bi({ ne: "जिम्मेवार अधिवक्ता", en: "Assigned advocate" })}:{" "}
                    <strong>{assigned.fullName[lang]}</strong>
                    {assigned.nbcLicence && (
                      <span className="font-mono text-xs text-ink-3">
                        {" "}
                        ({bi({ ne: "इजाजत नं.", en: "Licence no." })} {assigned.nbcLicence})
                      </span>
                    )}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="question" className="block text-sm font-semibold">
                  {bi({ ne: "तपाईंको अवस्था वर्णन गर्नुहोस्", en: "Describe your situation" })}
                </label>
                <textarea
                  id="question"
                  rows={7}
                  required
                  minLength={10}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="mt-1.5 w-full border border-rule-strong bg-surface px-3 py-2.5 text-base outline-none transition-colors focus:border-accent"
                />
                <p className="mt-1.5 text-sm text-ink-3">
                  {bi({
                    ne: "जति स्पष्ट लेख्नुहुन्छ, त्यति नै उपयोगी जवाफ पाउनुहुनेछ।",
                    en: "The more specific you are, the more useful the answer will be.",
                  })}
                </p>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="bg-accent px-5 py-2.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {busy ? "…" : `${bi({ ne: "पठाउनुहोस्", en: "Submit" })} — ${money(service.priceNpr)}`}
              </button>
            </form>
          ) : (
            <form onSubmit={onScreen} className="space-y-5">
              <div>
                <span className="block text-sm font-semibold">
                  {bi({ ne: "कस्तो सेवा चाहिन्छ?", en: "What do you need?" })}
                </span>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {(["question", "consultation", "document_review"] as ServiceId[]).map((id) => (
                    <label
                      key={id}
                      className={`cursor-pointer border p-3 text-sm transition-colors ${
                        kind === id ? "border-accent bg-accent-soft" : "border-rule-strong"
                      }`}
                    >
                      <input
                        type="radio"
                        name="kind"
                        className="sr-only"
                        checked={kind === id}
                        onChange={() => setKind(id)}
                      />
                      <span className="block font-semibold">{bi(SERVICES[id].title)}</span>
                      <span className="mt-1 block font-mono text-xs text-ink-3">
                        {money(SERVICES[id].priceNpr)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="area" className="block text-sm font-semibold">
                  {bi({ ne: "कानुनको क्षेत्र", en: "Area of law" })}
                </label>
                <select
                  id="area"
                  value={areaOfLaw}
                  onChange={(e) => setAreaOfLaw(e.target.value)}
                  className="mt-1.5 w-full border border-rule-strong bg-surface px-3 py-2.5 text-base outline-none focus:border-accent"
                >
                  {AREAS_OF_LAW.map((a) => (
                    <option key={a.id} value={a.id}>
                      {bi(a.label)}
                    </option>
                  ))}
                </select>
              </div>

              {/*
                Conflict screening comes first and alone. The matter is not described
                on this screen — that is the whole point of the two-step flow.
              */}
              <div className="border-l-2 border-orpiment bg-surface p-4">
                <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-orpiment">
                  {bi({ ne: "पहिलो चरण — स्वार्थ जाँच", en: "Step one — conflict check" })}
                </p>
                <label htmlFor="opposing" className="mt-2 block text-sm font-semibold">
                  {bi({ ne: "विपक्षी पक्षको नाम", en: "Name of the other party" })}
                </label>
                <input
                  id="opposing"
                  required
                  value={opposingParty}
                  onChange={(e) => setOpposingParty(e.target.value)}
                  className="mt-1.5 w-full border border-rule-strong bg-surface px-3 py-2.5 text-base outline-none focus:border-accent"
                />
                <p className="mt-2 text-sm text-ink-2">
                  {bi({
                    ne: "फर्मले पहिले नै विपक्षी पक्षको तर्फबाट काम गरिरहेको भए यो विषय लिन मिल्दैन। त्यसैले विवरण लेख्नुअघि यो जाँच गरिन्छ।",
                    en: "If the firm already acts for the other side we cannot take your matter. That is why this is checked before you describe anything.",
                  })}
                </p>
              </div>

              {!loading && !user && (
                <p className="border-l-2 border-cinnabar bg-surface p-3 text-sm text-ink-2">
                  {bi({ ne: "जारी राख्न लगइन आवश्यक छ।", en: "You need to sign in to continue." })}{" "}
                  <Link href="/login?next=/advocate" className="text-accent underline">
                    {bi({ ne: "लगइन", en: "Sign in" })}
                  </Link>
                </p>
              )}

              <button
                type="submit"
                disabled={busy || (!loading && !user)}
                className="bg-accent px-5 py-2.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {busy ? "…" : bi({ ne: "जाँच गरी अगाडि बढ्नुहोस्", en: "Check and continue" })}
              </button>

              {error && (
                <p className="border-l-2 border-cinnabar bg-surface p-3 text-sm text-cinnabar" role="alert">
                  {error}
                </p>
              )}
            </form>
          )}
        </section>

        {/* ---------------- the two advocates ---------------- */}
        <aside className="space-y-4">
          <div className="border border-rule bg-surface p-4">
            <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-ink-3">
              {bi({ ne: "फर्मका अधिवक्ता", en: "The firm's advocates" })}
            </p>

            {advocates.length === 0 ? (
              <p className="mt-3 text-sm text-ink-2">
                {bi({
                  ne: "अधिवक्ताको विवरण लोड गर्न सकिएन। डेटाबेस कन्फिगर गरिएको छैन।",
                  en: "Advocate records unavailable — the database isn't configured here.",
                })}
              </p>
            ) : (
              <ul className="mt-3 space-y-4">
                {advocates.map((a) => (
                  <li
                    key={a.id}
                    className="flex gap-3 border-t border-dashed border-rule-strong pt-3 first:border-0 first:pt-0"
                  >
                    {/*
                      Rendered only when a portrait exists. A broken image on a
                      professional profile looks worse than no photograph — the same
                      rule the licence number follows.
                    */}
                    {a.photoPath && (
                      <Image
                        src={a.photoPath}
                        alt=""
                        width={56}
                        height={72}
                        className="h-[72px] w-[56px] flex-none border border-rule-strong object-cover object-top"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                    <p className="font-serif text-base font-semibold">{a.fullName[lang]}</p>
                    {/*
                      Rendered only when the firm has supplied it. A placeholder here
                      would read as an unlicensed advocate, which is worse than an
                      absence — and most firms list advocates by name and practice
                      area alone in any case.
                    */}
                    {a.nbcLicence && (
                      <p className="font-mono text-xs text-ink-3">
                        {bi({ ne: "बार काउन्सिल इजाजत नं.", en: "NBC licence no." })} {a.nbcLicence}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-ink-2">
                      {/* Enumerating every area under each name is noise, not information. */}
                      {a.practiceAreas.length >= AREAS_OF_LAW.length
                        ? bi({ ne: "सबै क्षेत्र", en: "All areas" })
                        : a.practiceAreas
                            .map((p) => AREAS_OF_LAW.find((x) => x.id === p))
                            .filter(Boolean)
                            .map((x) => bi(x!.label))
                            .join(" · ")}
                    </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-l-2 border-orpiment bg-surface p-4">
            <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-orpiment">
              {bi({ ne: "कमिसन छैन", en: "No commission" })}
            </p>
            <p className="mt-1.5 text-sm text-ink-2">
              {bi({
                ne: "फर्मले आफ्नै अधिवक्ताको सेवा आफैँ बिल गर्दछ। कुनै दलाली वा कमिसन लिइँदैन।",
                en: "The firm bills for its own advocates' work directly. No referral fee, no commission — the Rules of Conduct 2079 prohibit it.",
              })}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
