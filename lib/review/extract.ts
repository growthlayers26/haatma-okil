import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { ContractFactsSchema, type ContractFacts } from "./schema";

/**
 * Reads a pasted contract and returns structured observations.
 *
 * The model's job here is narrow on purpose: find the numbers and say which clauses
 * are present. It is never asked whether a term is lawful, and it is never asked for
 * a statutory reference — lib/review/rules.ts supplies both from our own reviewed
 * constants. See lib/review/schema.ts for why.
 *
 * ---------------------------------------------------------------------------
 * On swapping the model out
 *
 * Two providers are supported: any OpenAI-compatible endpoint (Nous Portal, or
 * anything else speaking that protocol), and Anthropic. Which one runs is decided by
 * configuration, not by code.
 *
 * The safety property survives the swap intact, and that is worth being precise
 * about. A citation cannot be fabricated here no matter how weak the model is,
 * because the component that writes citations is not the component that reads the
 * document — the schema this returns has no field for a statute, an opinion, or a
 * risk level, so there is nowhere for an invented one to go.
 *
 * What a weaker extractor DOES put at risk is the accuracy of the numbers, and that
 * is a subtler failure than a hallucinated citation rather than a smaller one. If the
 * model reports a monthly wage of 20,000 where the document says 12,000, the
 * deterministic rules will attach a perfectly real citation to a finding that is
 * simply wrong — and it will look exactly as authoritative as a correct one. So
 * everything below is strict: the output is validated against the schema before it is
 * trusted, a malformed response is refused rather than salvaged, and the prompt
 * presses hard on reporting null over guessing.
 *
 * Before relying on a new model, run the same real contract through it and through a
 * known-good one and compare the numbers. That comparison is cheap and it is the only
 * thing that actually tells you whether the extraction is good enough for this.
 * ---------------------------------------------------------------------------
 */

export type ExtractOutcome =
  | { ok: true; facts: ContractFacts; inputTokens: number; outputTokens: number }
  | {
      ok: false;
      reason: "not_configured" | "too_long" | "refused" | "unparsed" | "error";
      message?: string;
    };

/** An OpenAI-compatible endpoint, e.g. Nous Portal. Takes precedence when set. */
function openAiCompatibleConfig() {
  const baseUrl = process.env.REVIEW_API_BASE_URL;
  const apiKey = process.env.REVIEW_API_KEY;
  const model = process.env.REVIEW_MODEL;

  if (!baseUrl || !apiKey || !model) return null;

  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey, model };
}

export function isReviewConfigured(): boolean {
  return Boolean(openAiCompatibleConfig()) || Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Which provider is actually in use, for the UI to be honest about. */
export function reviewProvider(): string | null {
  const openAi = openAiCompatibleConfig();
  if (openAi) return openAi.model;
  if (process.env.ANTHROPIC_API_KEY) return "claude-opus-5";
  return null;
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
 * Stable across every request, so it caches where the provider supports it. Volatile
 * content (the contract itself) goes in the user turn, after the cache breakpoint.
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

  const openAi = openAiCompatibleConfig();
  return openAi ? extractViaOpenAiCompatible(text, openAi) : extractViaAnthropic(text);
}

/* ------------------------------------------------------- OpenAI-compatible */

type OpenAiConfig = { baseUrl: string; apiKey: string; model: string };

type ChatCompletion = {
  choices?: { message?: { content?: string | null }; finish_reason?: string }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  error?: { message?: string };
};

async function extractViaOpenAiCompatible(
  text: string,
  config: OpenAiConfig,
): Promise<ExtractOutcome> {
  const jsonSchema = z.toJSONSchema(ContractFactsSchema, { io: "output" });

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Extract the facts from this document.\n\n<document>\n${text}\n</document>`,
    },
  ];

  /*
   * Ask for a schema-constrained response first.
   *
   * Support for json_schema varies between providers and between models on the same
   * provider, and a provider that does not support it tends to reject the request
   * rather than ignore the field. So a rejection falls back to asking in the prompt
   * and validating here — which is what the Zod parse below does in both cases
   * anyway, and is the only thing either path actually trusts.
   */
  const attempt = async (useSchema: boolean) => {
    const body: Record<string, unknown> = {
      model: config.model,
      messages: useSchema
        ? messages
        : [
            messages[0],
            {
              role: "user",
              content:
                `${messages[1].content}\n\nReply with JSON only — no prose, no code fence — ` +
                `matching this JSON Schema exactly:\n${JSON.stringify(jsonSchema)}`,
            },
          ],
      // Extraction is mechanical; sampling variety buys nothing and costs accuracy.
      temperature: 0,
      max_tokens: 16000,
    };

    if (useSchema) {
      body.response_format = {
        type: "json_schema",
        json_schema: { name: "contract_facts", schema: jsonSchema, strict: true },
      };
    }

    return fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  };

  let response: Response;

  try {
    response = await attempt(true);

    // 400 here usually means the model or provider does not do json_schema.
    if (response.status === 400) {
      response = await attempt(false);
    }
  } catch (error) {
    return {
      ok: false,
      reason: "error",
      message: error instanceof Error ? error.message : "unreachable",
    };
  }

  if (response.status === 401 || response.status === 403) {
    return { ok: false, reason: "not_configured" };
  }
  if (response.status === 429) {
    return { ok: false, reason: "error", message: "rate_limited" };
  }
  if (!response.ok) {
    return { ok: false, reason: "error", message: `api_${response.status}` };
  }

  const payload = (await response.json().catch(() => null)) as ChatCompletion | null;
  const choice = payload?.choices?.[0];
  const content = choice?.message?.content;

  if (payload?.error?.message) {
    return { ok: false, reason: "error", message: payload.error.message };
  }

  // Some providers report a safety stop this way. It is an outcome, not an exception.
  if (choice?.finish_reason === "content_filter") {
    return { ok: false, reason: "refused" };
  }

  /*
   * A response cut off mid-JSON parses as malformed and is refused below, but saying
   * so explicitly is more useful than "unparsed" — the fix is a longer limit, not a
   * different model.
   */
  if (choice?.finish_reason === "length") {
    return { ok: false, reason: "error", message: "truncated" };
  }

  if (!content) return { ok: false, reason: "unparsed" };

  const parsed = parseFacts(content);
  if (!parsed) return { ok: false, reason: "unparsed" };

  return {
    ok: true,
    facts: parsed,
    inputTokens: payload?.usage?.prompt_tokens ?? 0,
    outputTokens: payload?.usage?.completion_tokens ?? 0,
  };
}

/**
 * Validate the model's JSON against the schema.
 *
 * Returns null on anything that does not fit, rather than repairing it. A partially
 * understood contract is the failure this whole feature exists to avoid, and a
 * salvaged object would be indistinguishable downstream from a clean read.
 */
function parseFacts(content: string): ContractFacts | null {
  // Tolerate a fenced block, which weaker models add even when told not to. This is
  // unwrapping, not repairing — the JSON inside still has to be exactly right.
  const unfenced = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  let raw: unknown;
  try {
    raw = JSON.parse(unfenced);
  } catch {
    return null;
  }

  const result = ContractFactsSchema.safeParse(raw);
  return result.success ? result.data : null;
}

/* ------------------------------------------------------------------ Anthropic */

async function extractViaAnthropic(text: string): Promise<ExtractOutcome> {
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
