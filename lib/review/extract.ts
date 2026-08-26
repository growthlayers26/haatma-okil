import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ContractFactsSchema, type ContractFacts } from "./schema";

/**
 * Reads a pasted contract and returns structured observations.
 *
 * The model's job here is narrow on purpose: find the numbers and say which clauses
 * are present. It is never asked whether a term is lawful, and it is never asked for
 * a statutory reference — lib/review/rules.ts supplies both from our own reviewed
 * constants. See lib/review/schema.ts for why.
 */

export type ExtractOutcome =
  | { ok: true; facts: ContractFacts; inputTokens: number; outputTokens: number }
  | { ok: false; reason: "not_configured" | "too_long" | "refused" | "unparsed" | "error"; message?: string };

export function isReviewConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Roughly the longest document we will accept in one pass.
 *
 * Deliberately refuses rather than truncating. A contract silently cut in half would
 * produce a review that looks complete and has simply not read the second half —
 * which is the most dangerous possible failure for this feature.
 */
const MAX_CHARS = 120_000;

/*
 * Stable across every request, so it caches. Volatile content (the contract itself)
 * goes in the user turn, after the cache breakpoint.
 */
const SYSTEM_PROMPT = `You extract structured facts from Nepali legal documents.

The documents may be in Nepali (Devanagari), English, or a mixture. Nepali documents
often use Devanagari numerals (०१२३४५६७८९) and Bikram Sambat dates — convert numerals
to ordinary digits when reporting amounts, and report money in rupees as a plain
number without separators.

Your task is observation only:
- Report figures exactly as the document states them. Never infer a figure that is
  absent — report null instead. A null is a useful, accurate answer.
- Report which listed clause types appear.
- Quote notable passages verbatim.

You must NOT:
- State or imply whether any term is lawful, valid, enforceable, or advisable.
- Cite any statute, act, section, or legal authority.
- Recommend a change to the document.

Those judgements are made elsewhere by licensed advocates working from reviewed
statutory constants. Your observations feed that process. An extraction that quietly
guesses a number is far worse than one that reports null.`;

export async function extractFacts(contractText: string): Promise<ExtractOutcome> {
  if (!isReviewConfigured()) return { ok: false, reason: "not_configured" };

  const text = contractText.trim();
  if (text.length === 0) return { ok: false, reason: "error", message: "empty" };
  if (text.length > MAX_CHARS) return { ok: false, reason: "too_long" };

  const client = new Anthropic();

  try {
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 16000,
      // Extraction is mechanical rather than open-ended, and the statutory judgement
      // that follows is deterministic, so medium effort is the right trade here.
      output_config: {
        effort: "medium",
        format: zodOutputFormat(ContractFactsSchema),
      },
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Extract the facts from this document.\n\n<document>\n${text}\n</document>`,
        },
      ],
    });

    // A safety decline is a real outcome, not an exception — check before reading.
    if (response.stop_reason === "refusal") {
      return { ok: false, reason: "refused" };
    }

    if (!response.parsed_output) {
      return { ok: false, reason: "unparsed" };
    }

    return {
      ok: true,
      facts: response.parsed_output,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };
  } catch (error) {
    // Most specific first: a rate limit is worth retrying, a bad request never is.
    if (error instanceof Anthropic.RateLimitError) {
      return { ok: false, reason: "error", message: "rate_limited" };
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return { ok: false, reason: "not_configured" };
    }
    if (error instanceof Anthropic.BadRequestError) {
      return { ok: false, reason: "error", message: error.message };
    }
    if (error instanceof Anthropic.APIError) {
      return { ok: false, reason: "error", message: `api_${error.status}` };
    }
    return { ok: false, reason: "error", message: "unknown" };
  }
}
