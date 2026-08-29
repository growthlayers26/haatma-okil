"use client";

import Link from "next/link";
import { useState } from "react";
import { useLang } from "@/components/language-provider";
import { answerEnquiry, type DeskState, type DeskMatter } from "@/app/actions/desk";
import { SERVICES, AREAS_OF_LAW } from "@/lib/services";

export function DeskClient({ desk }: { desk: DeskState }) {
  const { bi } = useLang();
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const REASONS: Record<string, string> = {
    too_short: bi({
      ne: "जवाफ अझै छोटो छ। कम्तीमा केही वाक्य लेख्नुहोस्।",
      en: "That answer is very short. Write at least a few sentences.",
    }),
    not_assigned_to_you: bi({
      ne: "यो विषय तपाईंलाई जिम्मा दिइएको छैन।",
      en: "That matter is not assigned to you.",
    }),
    not_answerable: bi({
      ne: "यो विषय अहिले जवाफ दिन मिल्ने अवस्थामा छैन।",
      en: "That matter is not in a state that can be answered.",
    }),
    not_an_advocate: bi({
      ne: "तपाईंको खाता कुनै अधिवक्ता अभिलेखसँग जोडिएको छैन।",
      en: "Your account is not linked to an advocate record.",
    }),
  };

  if (!desk.linked) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">
          {bi({ ne: "अधिवक्ता डेस्क", en: "Advocate desk" })}
        </h1>
        {desk.reason === "unauthenticated" ? (
          <p className="mt-3 text-ink-2">
            {bi({ ne: "जारी राख्न लगइन गर्नुहोस्।", en: "Sign in to continue." })}{" "}
            <Link href="/login?next=/desk" className="text-accent underline">
              {bi({ ne: "लगइन", en: "Sign in" })}
            </Link>
          </p>
        ) : (
          <div className="mt-4 border-l-2 border-orpiment bg-surface p-5">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-orpiment">
              {bi({ ne: "खाता जोडिएको छैन", en: "Account not linked" })}
            </p>
            <p className="mt-1.5 max-w-[60ch] text-sm text-ink-2">
              {bi({
                ne: "यो पृष्ठ फर्मका अधिवक्ताका लागि हो। तपाईंको इमेल कुनै अधिवक्ता अभिलेखसँग मिलेन। फर्मले advocates तालिकामा इमेल राखेपछि यो पृष्ठ आफैँ खुल्नेछ।",
                en: "This page is for the firm's advocates. Your email does not match any advocate record. Once the firm sets each advocate's email on their record, signing in with it opens this page automatically.",
              })}
            </p>
          </div>
        )}
      </div>
    );
  }

  const waiting = desk.matters.filter((m) => m.status === "assigned");
  const done = desk.matters.filter((m) => m.status !== "assigned");

  async function submit(id: string) {
    setBusy(true);
    setNotice("");
    try {
      const result = await answerEnquiry({ enquiryId: id, answer: draft });
      if (result.ok) {
        setOpenId(null);
        setDraft("");
      } else {
        setNotice(REASONS[result.reason] ?? bi({ ne: "पठाउन सकिएन।", en: "Could not send it." }));
      }
    } finally {
      setBusy(false);
    }
  }

  function Matter({ m }: { m: DeskMatter }) {
    const area = AREAS_OF_LAW.find((a) => a.id === m.areaOfLaw);
    const overdue = m.dueAt && new Date(m.dueAt).getTime() < Date.now() && m.status === "assigned";

    return (
      <div className={`border-l-2 bg-surface p-5 ${overdue ? "border-cinnabar" : "border-rule-strong"}`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-serif text-lg font-semibold tracking-tight">
            {bi(SERVICES[m.kind].title)}
          </p>
          <span
            className={`font-mono text-xs uppercase tracking-wider ${
              overdue ? "text-cinnabar" : m.status === "answered" ? "text-malachite" : "text-orpiment"
            }`}
          >
            {overdue ? bi({ ne: "म्याद नाघेको", en: "Overdue" }) : m.status}
          </span>
        </div>
        <p className="mt-0.5 font-mono text-xs text-ink-3">
          {area ? bi(area.label) : m.areaOfLaw}
          {m.dueAt && ` · ${bi({ ne: "म्याद", en: "due" })} ${new Date(m.dueAt).toLocaleDateString()}`}
          {m.coveredByPlan && ` · ${bi({ ne: "योजनामा", en: "on plan" })}`}
        </p>

        {m.question && (
          <p className="mt-3 whitespace-pre-wrap border-t border-dashed border-rule-strong pt-3 text-sm text-ink-2">
            {m.question}
          </p>
        )}

        {m.answer ? (
          <div className="mt-3 border-t border-dashed border-rule-strong pt-3">
            <p className="font-mono text-xs uppercase tracking-wider text-malachite">
              {bi({ ne: "दिइएको जवाफ", en: "Your answer" })}
            </p>
            <p className="mt-1.5 whitespace-pre-wrap text-sm text-ink-2">{m.answer}</p>
          </div>
        ) : openId === m.id ? (
          <div className="mt-3">
            <textarea
              rows={8}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={bi({
                ne: "जवाफ लेख्नुहोस्। ग्राहकले यही पाठ जस्ताको तस्तै देख्नुहुनेछ।",
                en: "Write your answer. The client sees this text exactly as written.",
              })}
              className="w-full border border-rule-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => submit(m.id)}
                className="bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {busy ? "…" : bi({ ne: "जवाफ पठाउनुहोस्", en: "Send answer" })}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpenId(null);
                  setDraft("");
                }}
                className="border border-rule-strong px-4 py-2 text-sm text-ink-2 transition-colors hover:border-accent hover:text-accent"
              >
                {bi({ ne: "रद्द", en: "Cancel" })}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setOpenId(m.id);
              setDraft("");
            }}
            className="mt-3 border border-accent px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent-soft"
          >
            {bi({ ne: "जवाफ लेख्नुहोस्", en: "Write an answer" })}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold tracking-tight">
        {bi({ ne: "अधिवक्ता डेस्क", en: "Advocate desk" })}
      </h1>
      <p className="mt-2 font-mono text-xs uppercase tracking-wider text-ink-3">
        {desk.advocateName}
      </p>

      {notice && (
        <p className="mt-4 border-l-2 border-orpiment bg-surface p-3 text-sm text-ink-2" role="status">
          {notice}
        </p>
      )}

      <section className="mt-8">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.1em] text-ink-3">
          {bi({ ne: "जवाफ पर्खिरहेका", en: "Waiting for you" })}
        </h2>
        {waiting.length === 0 ? (
          <p className="mt-3 border border-dashed border-rule-strong p-5 text-sm text-ink-2">
            {bi({ ne: "अहिले केही पनि बाँकी छैन।", en: "Nothing waiting." })}
          </p>
        ) : (
          <div className="mt-3 space-y-4">
            {waiting.map((m) => (
              <Matter key={m.id} m={m} />
            ))}
          </div>
        )}
      </section>

      {done.length > 0 && (
        <section className="mt-10">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.1em] text-ink-3">
            {bi({ ne: "सकिएका", en: "Closed" })}
          </h2>
          <div className="mt-3 space-y-4">
            {done.map((m) => (
              <Matter key={m.id} m={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
