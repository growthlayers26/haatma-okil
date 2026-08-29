"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLang } from "./language-provider";
import { useAuth } from "./auth-provider";
import { LANG_LABEL, OTHER_LANG } from "@/lib/i18n";
import type { Bilingual } from "@/lib/types";

/**
 * Navigation lives in one array so the desktop bar and the mobile sheet cannot
 * disagree about what the site contains.
 */
const NAV: { href: string; label: Bilingual }[] = [
  { href: "/templates", label: { ne: "कागजात", en: "Documents" } },
  { href: "/services", label: { ne: "सेवा", en: "Services" } },
  { href: "/advocate", label: { ne: "अधिवक्ता", en: "Advocates" } },
  { href: "/pricing", label: { ne: "मूल्य", en: "Pricing" } },
  { href: "/sign", label: { ne: "हस्ताक्षर", en: "Signing" } },
  { href: "/team", label: { ne: "टोली", en: "Team" } },
  { href: "/dashboard", label: { ne: "मेरो खाता", en: "Dashboard" } },
];

export function SiteHeader() {
  const { lang, toggle, t, bi } = useLang();
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  async function onSignOut() {
    setOpen(false);
    await signOut();
    router.push("/");
  }

  return (
    <header className="no-print sticky top-0 z-30 border-b border-rule bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-x-6 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2.5 py-1.5">
          {/*
            The Latin form is a transliteration of the Nepali rather than a
            translation. हातमा वकिल is the name, "lawyer in hand", so the two are set
            as one lockup instead of a name and a subtitle.
          */}
          <span className="whitespace-nowrap font-serif text-lg font-semibold tracking-[-0.02em] sm:text-xl">
            Haatma Okil
          </span>
          <span className="hidden whitespace-nowrap font-deva text-base font-semibold text-ink-3 sm:inline sm:text-lg">
            हातमा वकिल
          </span>
        </Link>

        {/*
          Inline from lg up only. Seven items wrapped onto two rows below that, which
          cost 143px of a phone screen before any content and left each link 18px
          tall — less than half a thumb.
        */}
        <nav className="ml-auto hidden items-center gap-x-5 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="py-2 font-mono text-[0.72rem] uppercase tracking-[0.08em] text-ink-2 transition-colors hover:text-accent"
            >
              {bi(item.label)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <button
            type="button"
            onClick={toggle}
            aria-label={`Switch to ${LANG_LABEL[OTHER_LANG[lang]]}`}
            className="flex h-11 items-center border border-rule-strong px-3 font-mono text-xs text-ink-2 transition-colors hover:border-accent hover:text-accent"
          >
            {LANG_LABEL[OTHER_LANG[lang]]}
          </button>

          {/* Render nothing until the session resolves, rather than flashing "Log in". */}
          {loading ? (
            <span className="h-9 w-16" aria-hidden />
          ) : user ? (
            <button
              type="button"
              onClick={onSignOut}
              className="hidden border border-rule-strong px-3 py-2 text-sm text-ink-2 transition-colors hover:border-accent hover:text-accent sm:block"
            >
              {bi({ ne: "लगआउट", en: "Sign out" })}
            </button>
          ) : (
            <Link
              href="/login"
              className="hidden whitespace-nowrap bg-accent px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:block"
            >
              {t("login")}
            </Link>
          )}

          {/* 44px square, which is the smallest a thumb reliably hits. */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={bi({ ne: "मेनु", en: "Menu" })}
            className="flex h-11 w-11 items-center justify-center border border-rule-strong text-ink-2 transition-colors hover:border-accent hover:text-accent lg:hidden"
          >
            <span aria-hidden className="text-lg leading-none">
              {open ? "✕" : "☰"}
            </span>
          </button>
        </div>
      </div>

      {/* The sheet. Rows are full width and 48px tall, so they are hard to miss. */}
      {open && (
        <nav id="site-menu" className="border-t border-rule lg:hidden">
          <div className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                // Closed here rather than in an effect on the path: the sheet must
                // not linger over the page the tap just chose.
                onClick={() => setOpen(false)}
                className={`block border-b border-rule py-3.5 font-mono text-sm uppercase tracking-[0.08em] transition-colors last:border-b-0 ${
                  pathname === item.href ? "text-accent" : "text-ink-2 hover:text-accent"
                }`}
              >
                {bi(item.label)}
              </Link>
            ))}

            {!loading &&
              (user ? (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="block w-full border-t border-rule py-3.5 text-left font-mono text-sm uppercase tracking-[0.08em] text-ink-2 transition-colors hover:text-accent"
                >
                  {bi({ ne: "लगआउट", en: "Sign out" })}
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block border-t border-rule py-3.5 font-mono text-sm uppercase tracking-[0.08em] text-accent sm:hidden"
                >
                  {t("login")}
                </Link>
              ))}
          </div>
        </nav>
      )}
    </header>
  );
}
