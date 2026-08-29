"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Lang, Bilingual } from "@/lib/types";
import { t as translate, type StringKey } from "@/lib/i18n";
import { LANG_COOKIE, LANG_COOKIE_ATTRS } from "@/lib/lang-cookie";

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
  /** Look up a UI string key. */
  t: (key: StringKey) => string;
  /** Resolve a bilingual value from template content. */
  bi: (value: Bilingual) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

/**
 * Seeded from the cookie the server already read, so the first paint is in the
 * reader's language. See lib/lang-cookie.ts for why this cannot be localStorage.
 */
export function LanguageProvider({
  children,
  initialLang,
}: {
  children: ReactNode;
  initialLang: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  // Keeping the document language attribute in sync is a write to an external
  // system, which is what an effect is for.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    // Written so the next request — and every server render in it — starts correct.
    document.cookie = `${LANG_COOKIE}=${next}; ${LANG_COOKIE_ATTRS}`;
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      toggle: () => setLang(lang === "ne" ? "en" : "ne"),
      t: (key: StringKey) => translate(key, lang),
      bi: (v: Bilingual) => v[lang],
    }),
    [lang, setLang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used inside LanguageProvider");
  return ctx;
}
