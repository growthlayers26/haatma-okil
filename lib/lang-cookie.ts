import type { Lang } from "./types";

/**
 * Language preference lives in a cookie, not localStorage.
 *
 * It has to. The chosen language decides rendered TEXT, so the server must know it
 * before it renders — localStorage is unreadable there, which meant every render
 * began in the default language and only corrected after hydration. An
 * English-preferring reader saw a flash of Nepali on every page load, including on
 * the face of a deed.
 *
 * A cookie is sent with the request, so the first byte is already correct.
 */

export const LANG_COOKIE = "mandala.lang";

// Nepali is the default: it is the language the documents are executed in and the
// one most users read most comfortably.
export const DEFAULT_LANG: Lang = "ne";

/** Narrow an arbitrary cookie value to a language we support. */
export function toLang(value: string | undefined | null): Lang {
  return value === "en" ? "en" : DEFAULT_LANG;
}

/**
 * A year, so the choice survives. Lax rather than Strict: a user returning from
 * Khalti or eSewa arrives on a cross-site redirect and should not land in the
 * language they did not pick.
 */
export const LANG_COOKIE_ATTRS = "path=/; max-age=31536000; samesite=lax";
