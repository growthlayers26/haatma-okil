"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import type { Lang, Bilingual } from "@/lib/types";
import { t as translate, type StringKey } from "@/lib/i18n";
import { usePersistentState } from "@/lib/use-persistent-state";

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

const STORAGE_KEY = "mandala.lang";

// Nepali is the default: it is the language the documents are executed in and the
// one most users read most comfortably.
const DEFAULT_LANG: Lang = "ne";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = usePersistentState<Lang>(STORAGE_KEY, DEFAULT_LANG);
  const lang: Lang = stored === "en" ? "en" : "ne";

  // Keeping the document language attribute in sync is a write to an external
  // system, which is what an effect is for.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => setStored(next), [setStored]);

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
