"use client";

import Link from "next/link";
import { useState } from "react";
import { useLang } from "@/components/language-provider";
import {
  createOrganisation,
  addMember,
  setRequireApproval,
  decideDocument,
  type OrgState,
  type QueuedDocument,
} from "@/app/actions/organisation";
import { getTemplate } from "@/lib/templates";
import { toNepaliDigits } from "@/lib/nepal";

type Props = {
  org: OrgState | null;
  queue: QueuedDocument[];
  templates: { id: string; name: string; baseSlug: string }[];
};

/**
 * Props come straight from the server component and are used directly rather than
 * copied into state. Every mutation revalidates /team, so the server re-renders and
 * these props update on their own — a state copy would go stale the moment someone
 * else on the team acted.
 */
export function TeamClient({ org, queue, templates }: Props) {
  const { bi, lang } = useLang();
  const [notice, setNotice] = useState("");
  const [orgName, setOrgName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const num = (n: number) => (lang === "ne" ? toNepaliDigits(n) : String(n));

  const REASONS: Record<string, string> = {
    seat_limit: bi({
      ne: "योजनामा भएका सबै सिट प्रयोग भइसके। थप गर्न योजना बढाउनुहोस्।",
      en: "Every seat on the plan is taken. Upgrade the plan to add more.",
    }),
    no_such_user: bi({
      ne: "यो इमेलमा खाता भेटिएन। पहिले उहाँलाई खाता बनाउन भन्नुहोस्।",
      en: "No account with that email. Ask them to sign up first, then add them.",
    }),
    already_member: bi({ ne: "यो व्यक्ति पहिले नै टोलीमा हुनुहुन्छ।", en: "They are already on the team." }),
    self_approval: bi({
      ne: "आफ्नै मस्यौदा आफैँले स्वीकृत गर्न मिल्दैन।",
      en: "You cannot approve your own draft — that is the point of the workflow.",
    }),
    not_permitted: bi({ ne: "तपाईंलाई यो अधिकार छैन।", en: "You do not have permission for that." }),
    not_in_plan: bi({ ne: "यो सुविधा तपाईंको योजनामा छैन।", en: "That feature is not in your plan." }),
    plan_has_no_seats: bi({
      ne: "तपाईंको योजनामा एक जना मात्र सिट छ। टोली बनाउन व्यवसाय वा संस्थागत योजना चाहिन्छ।",
      en: "Your plan has a single seat. A team needs the Business or Enterprise plan.",
    }),
    already_in_organisation: bi({
      ne: "तपाईं पहिले नै एउटा संस्थामा हुनुहुन्छ।",
      en: "You already belong to an organisation.",
    }),
    not_pending: bi({
      ne: "यो कागजात अहिले स्वीकृतिको प्रतीक्षामा छैन।",
      en: "That document is no longer awaiting a decision.",
    }),
  };

  const say = (reason: string, fallback: string) => setNotice(REASONS[reason] ?? fallback);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const result = await createOrganisation(orgName);
      if (!result.ok) say(result.reason, bi({ ne: "बनाउन सकिएन।", en: "Could not create it." }));
    } finally {
      setBusy(false);
    }
  }

  async function onInvite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const result = await addMember(inviteEmail);
      if (result.ok) setInviteEmail("");
      else say(result.reason, bi({ ne: "थप्न सकिएन।", en: "Could not add them." }));
    } finally {
      setBusy(false);
    }
  }

  async function onDecide(id: string, approve: boolean) {
    setBusy(true);
    setNotice("");
    try {
      const result = await decideDocument(id, approve);
      if (!result.ok) say(result.reason, bi({ ne: "गर्न सकिएन।", en: "Could not do that." }));
    } finally {
      setBusy(false);
    }
  }

  /* ---------------- no organisation yet ---------------- */
  if (!org) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">
          {bi({ ne: "टोली बनाउनुहोस्", en: "Create a team" })}
        </h1>
        <p className="mt-3 max-w-[60ch] text-ink-2">
          {bi({
            ne: "टोलीमा सहकर्मी थप्न, कागजात बाहिर जानुअघि स्वीकृति लिने प्रक्रिया राख्न र आफ्नै ढाँचा बनाउन सकिन्छ।",
            en: "A team lets you seat colleagues, run an approval step before documents go out, and keep your own templates.",
          })}
        </p>

        <form onSubmit={onCreate} className="mt-8 space-y-4">
          <div>
            <label htmlFor="orgName" className="block text-sm font-semibold">
              {bi({ ne: "संस्थाको नाम", en: "Organisation name" })}
            </label>
            <input
              id="orgName"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="mt-1.5 w-full border border-rule-strong bg-surface px-3 py-2.5 outline-none focus:border-accent"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="bg-accent px-5 py-2.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {busy ? "…" : bi({ ne: "बनाउनुहोस्", en: "Create" })}
          </button>
          {notice && (
            <p className="border-l-2 border-orpiment bg-surface p-3 text-sm text-ink-2" role="status">
              {notice}{" "}
              <Link href="/pricing" className="text-accent underline">
                {bi({ ne: "योजना हेर्नुहोस्", en: "See plans" })}
              </Link>
            </p>
          )}
        </form>
      </div>
    );
  }

  const isAdmin = org.role === "owner" || org.role === "admin";
  const seatsFull = org.seatsUsed >= org.seatsTotal;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold tracking-tight">{org.name}</h1>
      <p className="mt-2 font-mono text-xs uppercase tracking-wider text-ink-3">
        {org.role} · {num(org.seatsUsed)}/{num(org.seatsTotal)}{" "}
        {bi({ ne: "सिट प्रयोगमा", en: "seats used" })}
        {org.requireApproval && ` · ${bi({ ne: "स्वीकृति अनिवार्य", en: "approval required" })}`}
      </p>

      {notice && (
        <p className="mt-4 border-l-2 border-orpiment bg-surface p-3 text-sm text-ink-2" role="status">
          {notice}
        </p>
      )}

      {isAdmin && (
        <section className="mt-8">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.1em] text-ink-3">
            {bi({ ne: "सदस्य थप्नुहोस्", en: "Add a member" })}
          </h2>
          <form onSubmit={onInvite} className="mt-3 flex flex-wrap gap-2">
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="name@example.com"
              dir="ltr"
              lang="en"
              className="min-w-0 flex-1 border border-rule-strong bg-surface px-3 py-2.5 outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={busy || seatsFull}
              className="bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {bi({ ne: "थप्नुहोस्", en: "Add" })}
            </button>
          </form>
          <p className="mt-1.5 text-sm text-ink-3">
            {seatsFull
              ? bi({
                  ne: "सबै सिट प्रयोगमा छन्।",
                  en: "Every seat on the plan is taken.",
                })
              : bi({
                  ne: "खाता भइसकेको व्यक्तिलाई मात्र थप्न सकिन्छ — हामी कसैको तर्फबाट खाता बनाउँदैनौं।",
                  en: "Only people who already have an account can be added — we do not create logins on someone's behalf.",
                })}
          </p>
        </section>
      )}

      {org.role === "owner" && (
        <section className="mt-8 border border-rule bg-surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold">
                {bi({ ne: "किन्नुअघि स्वीकृति अनिवार्य", en: "Require approval before purchase" })}
              </p>
              <p className="mt-1 max-w-[58ch] text-sm text-ink-2">
                {bi({
                  ne: "सक्रिय भएपछि सदस्यले तयार गरेको कागजात प्रशासकले स्वीकृत नगरेसम्म किन्न मिल्दैन। कसैले आफ्नै मस्यौदा आफैँ स्वीकृत गर्न पाउँदैन।",
                  en: "With this on, a member's document cannot be bought until an administrator approves it. Nobody can approve their own draft.",
                })}
              </p>
            </div>
            <button
              type="button"
              disabled={busy || !org.canUseApproval}
              onClick={async () => {
                setBusy(true);
                const r = await setRequireApproval(!org.requireApproval);
                if (!r.ok) say(r.reason ?? "", bi({ ne: "बदल्न सकिएन।", en: "Could not change it." }));
                setBusy(false);
              }}
              className={`px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-40 ${
                org.requireApproval
                  ? "bg-accent text-white"
                  : "border border-rule-strong text-ink-2 hover:border-accent hover:text-accent"
              }`}
            >
              {org.requireApproval ? bi({ ne: "सक्रिय", en: "On" }) : bi({ ne: "निष्क्रिय", en: "Off" })}
            </button>
          </div>
          {!org.canUseApproval && (
            <p className="mt-3 border-t border-dashed border-rule-strong pt-3 text-sm text-ink-3">
              {bi({ ne: "संस्थागत योजनामा उपलब्ध।", en: "Available on the Enterprise plan." })}{" "}
              <Link href="/pricing" className="text-accent underline">
                {bi({ ne: "योजना", en: "Plans" })}
              </Link>
            </p>
          )}
        </section>
      )}

      {isAdmin && (
        <section className="mt-8">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.1em] text-ink-3">
            {bi({ ne: "स्वीकृतिको प्रतीक्षामा", en: "Waiting for approval" })}
          </h2>
          {queue.length === 0 ? (
            <p className="mt-3 border border-dashed border-rule-strong p-5 text-sm text-ink-2">
              {bi({ ne: "अहिले केही पनि प्रतीक्षामा छैन।", en: "Nothing is waiting." })}
            </p>
          ) : (
            <ul className="mt-3 grid gap-px border border-rule bg-rule">
              {queue.map((d) => {
                const t = getTemplate(d.templateSlug);
                return (
                  <li key={d.id} className="flex flex-wrap items-center gap-3 bg-surface p-4">
                    <span className="min-w-0 flex-1 font-serif text-base font-semibold">
                      {t ? bi(t.title) : d.templateSlug}
                    </span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onDecide(d.id, true)}
                      className="border border-malachite px-3 py-1.5 text-sm font-semibold text-malachite transition-colors hover:bg-malachite hover:text-white disabled:opacity-40"
                    >
                      {bi({ ne: "स्वीकृत", en: "Approve" })}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onDecide(d.id, false)}
                      className="border border-cinnabar px-3 py-1.5 text-sm font-semibold text-cinnabar transition-colors hover:bg-cinnabar hover:text-white disabled:opacity-40"
                    >
                      {bi({ ne: "अस्वीकृत", en: "Reject" })}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {isAdmin && (
        <section className="mt-8">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.1em] text-ink-3">
            {bi({ ne: "संस्थाका ढाँचा", en: "Your organisation's templates" })}
          </h2>
          <p className="mt-2 max-w-[62ch] text-sm text-ink-2">
            {bi({
              ne: "संस्थाका ढाँचाले फर्मको आधार कागजातमा आफ्ना थप सर्त र पूर्वनिर्धारित उत्तर जोड्दछन्। कानुनद्वारा निर्धारित सर्त हटाउन वा बदल्न मिल्दैन।",
              en: "An organisation template adds your own terms and preset answers on top of one of the firm's documents. It cannot remove or rewrite anything fixed by statute.",
            })}
          </p>
          {templates.length === 0 ? (
            <p className="mt-3 border border-dashed border-rule-strong p-5 text-sm text-ink-2">
              {org.canUseCustomTemplates
                ? bi({ ne: "अहिलेसम्म कुनै ढाँचा छैन।", en: "No templates yet." })
                : bi({ ne: "संस्थागत योजनामा उपलब्ध।", en: "Available on the Enterprise plan." })}
            </p>
          ) : (
            <ul className="mt-3 grid gap-px border border-rule bg-rule">
              {templates.map((t) => {
                const base = getTemplate(t.baseSlug);
                return (
                  <li key={t.id} className="bg-surface p-4">
                    <p className="font-serif text-base font-semibold">{t.name}</p>
                    <p className="mt-0.5 font-mono text-xs text-ink-3">
                      {bi({ ne: "आधार", en: "based on" })}: {base ? bi(base.title) : t.baseSlug}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
