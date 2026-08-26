"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "./language-provider";
import { useAuth } from "./auth-provider";
import { LANG_LABEL, OTHER_LANG } from "@/lib/i18n";

export function SiteHeader() {
  const { lang, toggle, t, bi } = useLang();
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  async function onSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <header className="no-print sticky top-0 z-30 border-b border-rule bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-serif text-lg font-semibold tracking-tight">Mandala Law</span>
          <span className="font-deva text-base font-semibold text-accent">मण्डल</span>
        </Link>

        <nav className="order-3 flex w-full items-center gap-5 text-sm sm:order-none sm:w-auto">
          <Link href="/templates" className="text-ink-2 transition-colors hover:text-accent">
            {t("navDocuments")}
          </Link>
          <Link href="/register-company" className="text-ink-2 transition-colors hover:text-accent">
            {bi({ ne: "कम्पनी दर्ता", en: "Register a company" })}
          </Link>
          <Link href="/advocate" className="text-ink-2 transition-colors hover:text-accent">
            {bi({ ne: "अधिवक्ता", en: "Advocates" })}
          </Link>
          <Link href="/pricing" className="text-ink-2 transition-colors hover:text-accent">
            {bi({ ne: "मूल्य", en: "Pricing" })}
          </Link>
          <Link href="/dashboard" className="text-ink-2 transition-colors hover:text-accent">
            {t("navDashboard")}
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            aria-label={`Switch to ${LANG_LABEL[OTHER_LANG[lang]]}`}
            className="border border-rule-strong px-2.5 py-1 font-mono text-xs text-ink-2 transition-colors hover:border-accent hover:text-accent"
          >
            {LANG_LABEL[OTHER_LANG[lang]]}
          </button>

          {/* Render nothing until the session resolves, rather than flashing "Log in". */}
          {loading ? (
            <span className="h-7 w-16" aria-hidden />
          ) : user ? (
            <button
              type="button"
              onClick={onSignOut}
              className="border border-rule-strong px-3 py-1.5 text-sm text-ink-2 transition-colors hover:border-accent hover:text-accent"
            >
              {bi({ ne: "लगआउट", en: "Sign out" })}
            </button>
          ) : (
            <Link
              href="/login"
              className="bg-accent px-3 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t("login")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
