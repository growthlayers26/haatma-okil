#!/usr/bin/env node
/**
 * Measure how well a model extracts facts from a Nepali contract.
 *
 * Structured-output support tells you the JSON will be well formed. It tells you
 * nothing about whether a model reads ०१२३४५६७८९ correctly, or handles a Bikram
 * Sambat date, or resists guessing a figure the document never states. Those are the
 * failures that reach a client with a real statutory citation stapled to them, and
 * they are the reason this script exists.
 *
 * The test document below is written here rather than generated from lib/templates,
 * deliberately. Our own templates are formulaic, and a model that scores well on them
 * has only proved it can read our formatting — most documents a client pastes in came
 * from somewhere else. So this one is mixed Devanagari and English, uses Devanagari
 * numerals for some figures and Latin for others, and states its date in Bikram
 * Sambat. Every value in EXPECTED is one I put in the text, which is what makes an
 * error measurable rather than a matter of opinion.
 *
 * Two of the checks have no right answer in the document at all: sick leave and the
 * overtime multiplier are simply absent. A model that reports a number for either has
 * invented it, and inventing a figure is far worse here than admitting one is missing
 * — the rules downstream will treat a fabricated number exactly as seriously as a
 * real one.
 *
 * Usage:
 *   node scripts/compare-review-models.mjs [model ...]
 *
 * Reads REVIEW_API_BASE_URL and REVIEW_API_KEY from .env.local. Never prints the key.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const env = {};
  try {
    for (const line of readFileSync(resolve(root, ".env.local"), "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...rest] = trimmed.split("=");
      env[key] = rest.join("=");
    }
  } catch {
    /* no .env.local — fall through to the check below */
  }
  return env;
}

const env = loadEnv();
const BASE_URL = (env.REVIEW_API_BASE_URL || "").replace(/\/+$/, "");
const API_KEY = env.REVIEW_API_KEY || "";

const TAGS = (env.REVIEW_API_TAGS || "").split(",").map((t) => t.trim()).filter(Boolean);

const CANDIDATES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["upstage/solar-pro4:free", "stepfun/step-3.7-flash:free", env.REVIEW_MODEL].filter(Boolean);

/* ------------------------------------------------------------------ the document */

const CONTRACT = `करार पत्र / EMPLOYMENT AGREEMENT

मिति: २०८२ साल जेठ १५ गते

यो करार हिमालय टेक प्रा.लि. (Himalaya Tech Pvt. Ltd.), रजिस्ट्रेशन नं. १२३४५६,
काठमाडौं (यसपछि "रोजगारदाता") र सुनिता श्रेष्ठ (Sunita Shrestha), नागरिकता नं.
७८-०१-७२-०००९१ (यसपछि "कर्मचारी") बीच सम्पन्न भएको छ।

1. नियुक्ति र परिवीक्षा (Appointment and probation)
   कर्मचारीलाई Software Engineer पदमा नियुक्त गरिएको छ। परिवीक्षा अवधि ८ (आठ)
   महिना हुनेछ।

2. पारिश्रमिक (Remuneration)
   मासिक तलब रु. १४,५०० (चौध हजार पाँच सय) हुनेछ, प्रत्येक महिनाको अन्त्यमा
   भुक्तानी गरिनेछ।

3. कार्य समय (Working hours)
   साप्ताहिक कार्य समय ५४ घण्टा हुनेछ। दैनिक ९ घण्टा काम गर्नुपर्नेछ।

4. बिदा (Leave)
   वार्षिक घर बिदा 12 दिन प्रदान गरिनेछ।

5. करार अवधि (Term)
   यो करार २ वर्षको निश्चित अवधिको लागि हो।

6. समाप्ति (Termination)
   कुनै पनि पक्षले ३० दिनको पूर्व सूचना दिई यो करार अन्त्य गर्न सक्नेछ।

7. गोपनीयता (Confidentiality)
   कर्मचारीले कम्पनीको व्यापारिक गोपनीयता कायम राख्नु पर्नेछ।

8. प्रचलित कानून (Governing law)
   यो करार नेपालको प्रचलित कानून बमोजिम व्याख्या गरिनेछ।

हस्ताक्षर / Signatures:

रोजगारदाता: ____________________    कर्मचारी: ____________________
`;

/**
 * What the document actually says. `null` means the document is silent, and reporting
 * a number there is a fabrication rather than a misreading.
 */
const EXPECTED = {
  documentType: "employment",
  "employment.monthlySalaryNpr": 14500, // रु. १४,५०० — Devanagari, with a separator
  "employment.probationMonths": 8, // ८ महिना — Devanagari
  "employment.weeklyHours": 54, // ५४ घण्टा — Devanagari
  "employment.dailyHours": 9, // ९ घण्टा — Devanagari
  "employment.annualLeaveDays": 12, // "12 दिन" — Latin digits mid-Devanagari
  "employment.noticePeriodDays": 30, // ३० दिन — Devanagari
  "employment.isFixedTerm": true, // "२ वर्षको निश्चित अवधि"
  "employment.sickLeaveDays": null, // NOT STATED — a number here is invented
  "employment.overtimeRateMultiplier": null, // NOT STATED — a number here is invented
  "employment.mentionsSocialSecurityFund": false, // SSF is never mentioned
};

/* ------------------------------------------------------------------ the run */

const SYSTEM_PROMPT = `You extract structured facts from Nepali legal documents.

The documents may be in Nepali (Devanagari), English, or a mixture. Nepali documents
often use Devanagari numerals (०१२३४५६७८९) and Bikram Sambat dates — convert numerals
to ordinary digits when reporting amounts, and report money in rupees as a plain
number without separators.

Report figures exactly as the document states them. Never infer a figure that is
absent — report null instead. A null is a useful, accurate answer. Do not state
whether any term is lawful, and do not cite any statute.

Reply with JSON only, matching this shape:
{"documentType":"employment|lease|loan|service|nda|partnership|sale|other",
 "language":"ne|en|mixed",
 "employment":{"monthlySalaryNpr":number|null,"probationMonths":number|null,
   "weeklyHours":number|null,"dailyHours":number|null,"annualLeaveDays":number|null,
   "sickLeaveDays":number|null,"noticePeriodDays":number|null,
   "overtimeRateMultiplier":number|null,"mentionsSocialSecurityFund":boolean,
   "isFixedTerm":boolean}}`;

function get(object, path) {
  return path.split(".").reduce((value, key) => (value == null ? undefined : value[key]), object);
}

async function run(model) {
  const started = Date.now();

  let response;
  try {
    response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 4000,
        // Nous Portal rejects a request without these. Format is "key=value", and a
        // user= tag is mandatory; other OpenAI-compatible providers ignore the field.
        ...(TAGS.length ? { tags: TAGS } : {}),
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Extract the facts.\n\n<document>\n${CONTRACT}\n</document>` },
        ],
      }),
    });
  } catch (error) {
    return { model, error: error.message };
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    return { model, error: `HTTP ${response.status} ${body.slice(0, 120)}` };
  }

  const payload = await response.json().catch(() => null);
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) return { model, error: "empty response" };

  let facts;
  try {
    facts = JSON.parse(content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""));
  } catch {
    return { model, error: "response was not valid JSON", raw: content.slice(0, 160) };
  }

  const results = Object.entries(EXPECTED).map(([path, want]) => {
    const got = get(facts, path) ?? null;
    return { path, want, got, pass: got === want };
  });

  return { model, seconds: ((Date.now() - started) / 1000).toFixed(1), results };
}

/* ------------------------------------------------------------------ report */

if (!BASE_URL || !API_KEY) {
  console.error("REVIEW_API_BASE_URL and REVIEW_API_KEY must be set in .env.local.");
  process.exit(1);
}

if (API_KEY.startsWith("<")) {
  console.error(`REVIEW_API_KEY is still the placeholder text (${API_KEY}).`);
  console.error("Put a real key there — the example command was meant to be edited, not pasted.");
  process.exit(1);
}

console.log(`Extraction accuracy — ${CANDIDATES.length} model(s)\n`);

for (const model of CANDIDATES) {
  const outcome = await run(model);

  if (outcome.error) {
    console.log(`${model}\n  FAILED: ${outcome.error}`);
    if (outcome.raw) console.log(`  raw: ${outcome.raw}`);
    console.log();
    continue;
  }

  const passed = outcome.results.filter((r) => r.pass).length;
  const invented = outcome.results.filter((r) => r.want === null && r.got !== null);

  console.log(`${model}   ${passed}/${outcome.results.length} correct   ${outcome.seconds}s`);

  for (const r of outcome.results.filter((x) => !x.pass)) {
    const note = r.want === null ? "  ← INVENTED, document is silent" : "";
    console.log(`   ✗ ${r.path.padEnd(38)} want ${String(r.want).padEnd(8)} got ${String(r.got)}${note}`);
  }

  if (invented.length > 0) {
    console.log(`   ${invented.length} fabricated figure(s) — disqualifying for legal use.`);
  }

  console.log();
}
