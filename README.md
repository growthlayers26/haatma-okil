# हातमा वकिल — Haatma Okil

A legal document platform for Nepal. Modelled on Rocket
Lawyer's business, rebuilt against Nepali statute rather than translated from the
American product.

## Why this isn't a Rocket Lawyer clone

Four things had to change, and each one shaped the code:

| Rocket Lawyer | Here | Because |
| --- | --- | --- |
| Click-wrap e-signature | Print-and-notarise, CA integration deferred to Phase 5 | ETA 2063 recognises a signature only with a certificate from an OCC-licensed authority |
| Card subscription | Per-document purchase leads, wallet-first | eSewa/Khalti clear most online payment; card-on-file is a weak assumption |
| Attorney marketplace | Firm's own licensed advocates | Bar Council Rules of Conduct 2079 prohibit commission for referrals |
| US filing services | OCR CAMIS drafting, not portal access | Nepal's company registration portal is already free and online |

Full reasoning: the build plan and wireframes published alongside this repo.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Supabase (Postgres + RLS) · Vitest

## Architecture

**Legal content is code, not data.** Templates live in `lib/templates/` under version
control and review. The database stores what a user answered and what they paid —
never clause text. That keeps legal content in git and the schema free of legal drift.

```
lib/
  types.ts          Template, Clause, Field, Citation, Rule
  nepal.ts          Statutory constants — wage floors, leave, SSF, capital thresholds
  bs-date.ts        Bikram Sambat conversion and formatting
  render.ts         Clause assembly, token interpolation, statutory validation
  i18n.ts           UI strings, bilingual throughout
  templates/        The documents themselves
```

Three ideas carry the design:

1. **Citations are structured data.** Every clause and question carries the provision
   it derives from. An amendment becomes a query — "which templates cite Labour Act
   §11" — rather than an audit of prose.
2. **Clause selection is data, not branching.** Answers map to clause conditions and
   the renderer assembles whatever survives. A new document type is a new template
   object, never new rendering code.
3. **Statutory floors block generation.** A contract below minimum wage or above the
   probation ceiling cannot be produced. A platform run by a Bar Council–licensed firm
   cannot emit an instrument it knows to be unlawful, so these are not dismissible.

### Bilingual and Bikram Sambat

Nepali is the default and the language documents are executed in; English is the
counterpart banks and foreign counterparties ask for. Both are schema-level: every
string is a `Bilingual`, and Nepali output uses Devanagari numerals and lakh grouping
(१,००,००० — not 100,000).

Dates are Bikram Sambat via `nepali-date-converter`. BS month lengths vary per year
with no closed-form rule, so this is delegated to a maintained library rather than a
hand-written table — a wrong date on an executed contract is a legal defect.

## Running it

```bash
npm install && npm run dev
```

Copy `.env.example` to `.env.local` for Supabase and gateway credentials. **The app
runs without any of them** — drafting, preview and bilingual rendering all work
anonymously against localStorage, and payment returns a clear "not configured" message
rather than failing. Credentials add accounts, durable documents, the advocate desk,
and live payment.

Apply the migrations in `supabase/migrations/` in order.

### Accounts

Sign-in is an emailed one-time link — no passwords, because password handling is the
largest security liability a small firm can take on and buys nothing over a link.
Phone OTP suits the Nepali market better and Supabase supports it; it needs an SMS
provider wired up.

Nothing is gated behind an account except payment and the advocate desk. A visitor
drafts anonymously, and their drafts are claimed onto the account at first sign-in —
losing work by logging in would be the worst possible moment to lose it.

## The advocate desk

The firm has **two practising advocates**. This is not a tiered support desk — both
are licensed counsel, so a matter is *assigned* to one of them rather than escalated
between them. `assign_advocate()` prefers a practice-area match, then the lighter open
caseload, so neither advocate silently accumulates the whole queue.

Conflict screening runs **before** the matter is described, and that ordering is a
professional-conduct requirement rather than a UX preference: the opposing party is
named and checked first, so a conflicted enquiry is refused before any privileged
detail enters the system. `submitEnquiryDetail` refuses unless `conflict_cleared_at`
is already set, so no code path can store detail on an unscreened matter.

No referral commission and no revenue share — the Rules of Conduct 2079 prohibit
paying commission for cases, so the firm bills its own clients for its own advocates.

## Payment safety

Payment is wired end to end for **Khalti ePay v2** and **eSewa ePay v2** and activates
on credentials alone. Four rules hold it together:

1. **The redirect never marks an order paid.** It carries only an order id; the server
   then asks the gateway what actually happened. Trusting redirect parameters is the
   standard Nepali checkout bug and is exploitable by typing the success URL.
2. **The client never sends a price.** It names what it's buying; the amount is
   recomputed from the registry. A posted `amount: 1` buys nothing.
3. **Amounts are reconciled.** If the gateway reports taking a different amount than
   the order says, the order fails rather than releasing the document.
4. **Verification is idempotent.** Gateways retry and users refresh; the paid
   transition is conditioned on the row still being `pending`.

Two unit mismatches worth knowing, both handled inside the gateway modules: Khalti
quotes **paisa**, eSewa quotes **rupees**, and eSewa's HMAC-SHA256 signature covers
exactly the fields in `signed_field_names`, *in that order*.

## Contract review

Paste a contract, get back points to raise with an advocate. The architecture is the
point: a language model asked to review a contract will eventually cite a section
that does not exist, and an invented citation in a legal product is worse than no
product. So the work is split.

The model **extracts only** — its output schema has no field for an opinion, a risk
level or a statutory reference, and it reports null rather than guessing a figure
that is absent. Deterministic rules in `lib/review/rules.ts` **judge**, comparing
those figures against the constants in `lib/nepal.ts`. A citation cannot be
fabricated, because the component that writes citations is not the component that
reads the document.

Findings are phrased as questions for an advocate, never conclusions. Only a Bar
Council–licensed advocate may advise, and software telling a user their contract is
"illegal" is doing exactly that. A test greps the findings for that vocabulary so the
constraint fails a build rather than relying on memory.

The pasted contract is never stored. It may be privileged, it names third parties who
never consented to be here, and it is useless once the facts are extracted.

## Organisations

Seats, roles and an approval workflow. Seat limits are atomic — `add_org_member`
locks the organisation row, so two invitations accepted together serialise rather
than overshooting the plan. Approval gates **payment**, not display: a workflow a
member can walk around by paying is decorative. Nobody may approve their own draft.

Organisation templates are **overlays**, not documents. An overlay may preset answers
and append clauses; it may not carry `locked` or `citation`, and may not reuse a base
clause id. That boundary is why the feature can exist at all without reopening the
legal-content-in-code rule.

## Signing

Two routes are modelled and one ships working. **Wet ink** — print, sign, record where
the executed original is held — is legally effective today. **Digital certificate** is
modelled in full and cannot complete until the firm selects an OCC-licensed certifying
authority.

There is deliberately no click-wrap. Under ETA 2063 a typed name is not a recognised
signature, and the impossibility is enforced in `complete_envelope` rather than in the
UI, so the guarantee does not depend on this application being correct.

## Reconciliation

`POST /api/payment/reconcile`, guarded by a shared secret and meant for a cron. Without
it a payment only settled if the buyer returned to the return page — a closed tab or a
dropped mobile connection left money taken and nothing released. It also drains the
notification queue in the same pass.

## Status

| Item | State |
| --- | --- |
| Document engine, wizard, bilingual rendering, BS dates | **Built** |
| Auth, server-side documents, Khalti + eSewa, verification | **Built** |
| Advocate desk, conflict screening, two-advocate routing | **Built** |
| Company formation, trademark, PAN/VAT filings | **Built** |
| Subscription tiers with metered quota | **Built** |
| Contract review | **Built** |
| Organisations, seats, approval, overlay templates | **Built** |
| Signature envelopes, signatory access | **Built** |
| Payment reconciliation, notification queue | **Built** |
| Licensed-CA digital signing | Structure only — see below |

**31 templates** across employment, property, business and family. 14 migrations.
33 tests (`npm test`).

### Not built, deliberately

- **Click-wrap e-signature.** ETA 2063 recognises a signature only with a certificate
  from an OCC-licensed authority. A "sign" button would produce void documents, which
  is worse than having no feature.
- **Fonepay and cards.** The initiate route returns a clear "not enabled" rather than
  pretending.
- **A notification provider.** The queue records everything and dispatches when a
  sender is configured, so nothing is lost in the meantime.

PDF output is browser print — the browser shapes Devanagari correctly, which a JS PDF
library will not without an embedded font and a shaping pass.

## Before this goes live

Every statutory reference, constant, and clause in this repo was drafted from public
sources and **requires sign-off by a Bar Council–licensed advocate at the firm.**

Specific placeholders that must be replaced:

- `review.nbcLicence` is `PENDING` on all five templates. Those are placeholders, not
  approvals.
- The two rows seeded into `advocates` in `0002_advocates.sql` carry placeholder names
  and licence numbers `PENDING-1` / `PENDING-2`. **Replace both with the firm's real
  advocates before the page is shown to any client** — a licence number is a
  professional credential and inventing one is not a placeholder, it's a fabrication.
- `MIN_MONTHLY_WAGE_NPR` and the leave floors in `lib/nepal.ts` must be reconfirmed
  against the current Ministry of Labour notice.
- `screenConflict()` matches only against existing client names in this system. Before
  launch it must also read the firm's own conflict register, which lives outside this
  application today. A false negative here is a conduct breach, not a bug.
- The compliance calendar dates in the dashboard are illustrative. Replace them with
  the firm's authoritative filing calendar.
