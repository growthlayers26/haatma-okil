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

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Bagisto 2 (Laravel 12, MySQL 8) · Vitest

Bagisto runs in Docker and owns commerce and identity: customers, cart, checkout,
orders, invoices, payment methods, the admin panel and mail. The legal domain lives
alongside it in the same MySQL database, in `legal_`-prefixed tables owned by a
Bagisto package. The legal reasoning stays here in TypeScript — see below.

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

Two processes: Bagisto in Docker, and this app. Bagisto lives in its own checkout
(`bagisto-docker/`), not in this repo.

```bash
docker compose -f docker-compose.nginx-php.yml up -d
```

```bash
npm install && npm run dev
```

Copy `.env.example` to `.env.local`. It needs the MySQL connection Bagisto uses,
`BAGISTO_URL`, and `LEGAL_API_SECRET` — which must match the same key in Bagisto's
`.env`, because it is what stops the mail endpoint being an open relay.

Apply the schema and build the shop catalogue:

```bash
docker exec nginx-php sh -lc 'cd /var/www/html/bagisto && php artisan migrate'
```

```bash
curl -s http://localhost:3000/api/catalogue > /path/to/bagisto/storage/app/catalogue.json
```

```bash
docker exec nginx-php sh -lc 'cd /var/www/html/bagisto && php artisan legal:seed-catalogue'
```

`migrate` also switches the shop's base currency to NPR. Bagisto installs with USD as
its only currency, and the catalogue seeder writes the firm's price list in as plain
numbers — so before this, a Rs 599 contract was offered at $599, about a hundred and
thirty times its price, and nothing failed loudly because the checkout rendered a
perfectly ordinary dollar figure.

Then give each advocate desk access:

```bash
docker exec nginx-php sh -lc 'cd /var/www/html/bagisto && php artisan legal:link-advocates'
```

It reports who can open the desk and who cannot. Advocates sign in with a Bagisto
**staff** account, created in the admin panel at the same address held on their
advocate record — the command deliberately does not create those accounts, because
choosing a password on a named advocate's behalf is not something a script should do.
A mismatched address does not error; it simply never matches, and the advocate opens
an empty desk that looks exactly like having no matters.

The catalogue step exists so the price list has one home. Templates, services and plans
are priced in `lib/` and copied into Bagisto's catalogue from there; maintaining the
prices by hand in the admin panel would create a second price list, and the day the two
disagree is the day a client is charged something the site did not quote. Re-run it
after any price change — it matches on SKU and updates in place.

**The app still runs without any of it.** Drafting, preview and bilingual rendering
work anonymously against localStorage. What the database adds is accounts, durable
documents, the advocate desk and purchase.

Mail goes to Mailpit at http://localhost:8025. The shop is at http://localhost, its
admin at http://localhost/admin.

### Where the Bagisto package lives

`bagisto/LegalDesk/` — in this repo, bind-mounted into the Bagisto container at
`packages/HaatmaOkil/LegalDesk`. It is the firm's own code and belongs with the firm's
code; kept inside the Bagisto checkout it would sit untracked among vendor files, one
`git clean` or upstream pull away from being lost.

**Three edits inside the Bagisto checkout make it load, and they are not in this
repo.** They live in a checkout that tracks upstream Bagisto, so a `git checkout .`, a
stash, or an upstream merge there silently unloads the entire package — every file
still present, and Laravel no longer aware of any of it. Written down here because
that failure is silent, and because recreating them from memory at that point is
exactly when nobody will remember there were three.

In `docker-compose.nginx-php.yml`, under the `nginx-php` service volumes — note the
absolute path, which has to be corrected if this repo moves or another machine runs it:

```
- /ABSOLUTE/PATH/TO/lawyer/bagisto/LegalDesk:/var/www/html/bagisto/packages/HaatmaOkil/LegalDesk
```

In `bagisto/composer.json`, under `autoload.psr-4`:

```
"HaatmaOkil\\LegalDesk\\": "packages/HaatmaOkil/LegalDesk/src"
```

In `bagisto/bootstrap/providers.php`, the import plus `LegalDeskServiceProvider::class`
in the returned array.

To check the package is actually loaded — this 401s when it is, and 404s when it is
not, which is the difference between "wrong password" and "the package is gone":

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost/api/legal/auth/me
```

It owns the schema and nothing else. The legal reasoning — which clauses a template
carries, what the statute requires, whether a draft breaches it — stays in TypeScript,
written once and shared by server and browser. Reimplementing any of it in PHP would
put the same rule in two languages and let them drift, which is the one failure mode a
legal product cannot tolerate.

The fifteen Postgres migrations this replaced were never applied anywhere and are gone
from the tree; they remain in git history at 5291adb if the reasoning in their comments
is ever wanted.

### Accounts

An account is a **Bagisto customer**, and sign-in goes through Bagisto — it owns the
password hashing and the three states that should stop someone getting in: unverified,
suspended, deactivated. The app holds the returned token in an httpOnly cookie and
verifies it against `personal_access_tokens` on its own connection, so reading a
session costs one indexed lookup rather than a round trip to PHP.

This replaced an emailed one-time link, and the trade is worth stating. The original
reasoning was that password handling is the largest liability a small firm can take on;
that argument is much weaker when the hashing belongs to Laravel rather than to this
codebase. What is genuinely lost is that a one-time link suits the Nepali market better
than another password. A magic-link guard belongs in Bagisto, next to the other
credentials — not as a second identity system here.

Advocates sign in separately, as Bagisto **admins**, under their own cookie. That is
what finally closes a real gap: `advocates.user_id` used to exist with nothing able to
set it, so no advocate could open an enquiry the firm had already been paid for.

Nothing is gated behind an account except payment and the advocate desk. A visitor
drafts anonymously, and their drafts are claimed onto the account at first sign-in —
losing work by logging in would be the worst possible moment to lose it.

## The advocate desk

The firm's advocates are all licensed counsel — this is not a tiered support desk, so
a matter is *assigned* to one of them rather than escalated between them. `assign_advocate()` prefers a practice-area match, then the lighter open
caseload, so neither advocate silently accumulates the whole queue.

Conflict screening runs **before** the matter is described, and that ordering is a
professional-conduct requirement rather than a UX preference: the opposing party is
named and checked first, so a conflicted enquiry is refused before any privileged
detail enters the system. `submitEnquiryDetail` refuses unless `conflict_cleared_at`
is already set, so no code path can store detail on an unscreened matter.

No referral commission and no revenue share — the Rules of Conduct 2079 prohibit
paying commission for cases, so the firm bills its own clients for its own advocates.

## Payment safety

Bagisto owns the money: the order, the invoice, the payment method and the gateway
call. Checkout is a browser redirect to `/legal/buy/<sku>`, which puts the item in the
customer's own Bagisto cart and hands them to Bagisto's checkout.

Two rules survive the move, and they are the ones that matter:

1. **The client never sends a price.** It names what it's buying; the amount comes from
   the registry via the SKU. A posted `amount: 1` buys nothing.
2. **Nothing is released on a redirect.** Entitlements are granted from a paid invoice
   row written by Bagisto's own checkout, never from a return URL. Trusting redirect
   parameters is the standard Nepali checkout bug and is exploitable by typing the
   success URL.

What a payment buys is recorded as a row in `legal_entitlements` — one per unit of an
order line, spent once. A paid document order grants "one document", and the customer
chooses which draft it releases; guessing from the order which draft they meant would
be wrong on the one occasion it mattered.

**No Nepali gateway is connected yet.** Bagisto has eSewa and Khalti extensions
available and none is installed, so today's usable methods are the ones Bagisto ships.
The verification logic for Khalti ePay v2 and eSewa ePay v2 is kept in
`lib/payments/{khalti,esewa}.ts` — it is no longer in the app's own order path, but it
encodes two unit mismatches worth keeping: Khalti quotes **paisa**, eSewa quotes
**rupees**, and eSewa's HMAC-SHA256 signature covers exactly the fields in
`signed_field_names`, *in that order*. That is the starting point for a Bagisto payment
extension.

### The seam

A customer signs in twice — once here, once on the shop — because these are two
applications sharing one account rather than one application. It is left visible rather
than papered over with a shared session cookie, which is a decision about cookie scope
the firm should make deliberately.

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

## Redemption

A paid invoice becomes an entitlement in two ways, and the first is the one that
matters to a customer: the dashboard redeems that customer's own paid orders when they
look, so a purchase appears immediately. Scheduling lives in infrastructure and is the
piece most likely to be missing on a fresh deployment, and a customer who has just paid
and sees nothing concludes the payment failed.

`POST /api/payment/reconcile` is the second: guarded by a shared secret, meant for a
cron, it sweeps every customer and drains the notification queue in the same pass.
Nothing breaks without it — it catches subscriptions and filings, which nobody looks at
a dashboard to collect.

It used to chase payments whose buyer never came back from a wallet. It no longer has
to — Bagisto settles its own abandoned checkouts — so what remains is the half Bagisto
cannot do: reading a paid invoice and working out what it entitles someone to in legal
terms. Safe to run repeatedly; a unique index on the order line makes granting
idempotent.

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
