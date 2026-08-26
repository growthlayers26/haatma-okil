"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLang } from "@/components/language-provider";
import { createClient } from "@/lib/supabase/client";

/**
 * Sign-in by emailed one-time link.
 *
 * No password, because password handling is the single largest security liability a
 * small firm can take on and this buys nothing over a link. Phone OTP would suit the
 * Nepali market better and Supabase supports it — it needs an SMS provider wired up,
 * which is a Phase 2 decision alongside the payment gateways.
 */
function LoginForm() {
  const { bi, lang } = useLang();
  const params = useSearchParams();
  const next = params.get("next") ?? "/dashboard";

  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      setState("error");
      setMessage(
        bi({
          ne: "प्रमाणीकरण अहिले कन्फिगर गरिएको छैन।",
          en: "Authentication is not configured in this environment.",
        }),
      );
      return;
    }

    setState("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setState("error");
      setMessage(error.message);
      return;
    }
    setState("sent");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-serif text-3xl font-semibold tracking-tight">
        {bi({ ne: "लगइन गर्नुहोस्", en: "Sign in" })}
      </h1>
      <p className="mt-2 text-ink-2">
        {bi({
          ne: "तपाईंको इमेलमा एक पटक प्रयोग हुने लिङ्क पठाइनेछ। पासवर्ड चाहिँदैन।",
          en: "We'll email you a one-time link. No password needed.",
        })}
      </p>

      {state === "sent" ? (
        <div className="mt-8 border-l-2 border-malachite bg-surface p-5">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-malachite">
            {bi({ ne: "इमेल पठाइयो", en: "Link sent" })}
          </p>
          <p className="mt-2 text-sm text-ink-2">
            {bi({
              ne: `${email} मा पठाइएको लिङ्क खोल्नुहोस्। लिङ्क छोटो समयका लागि मात्र मान्य हुन्छ।`,
              en: `Open the link we sent to ${email}. It expires shortly, so use it soon.`,
            })}
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold">
              {bi({ ne: "इमेल ठेगाना", en: "Email address" })}
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
              lang="en"
              className="mt-1.5 w-full border border-rule-strong bg-surface px-3 py-2.5 text-base outline-none transition-colors focus:border-accent"
            />
          </div>

          <button
            type="submit"
            disabled={state === "sending"}
            className="w-full bg-accent px-5 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {state === "sending"
              ? "…"
              : bi({ ne: "लिङ्क पठाउनुहोस्", en: "Email me a link" })}
          </button>

          {state === "error" && (
            <p className="border-l-2 border-cinnabar bg-surface p-3 text-sm text-cinnabar" role="alert">
              {message}
            </p>
          )}
        </form>
      )}

      <p className="mt-8 border-t border-rule pt-4 text-sm text-ink-3" lang={lang}>
        {bi({
          ne: "खाता नबनाई पनि कागजात तयार गर्न सकिन्छ। भुक्तानी गर्ने बेलामा मात्र लगइन आवश्यक पर्दछ।",
          en: "You can draft a document without an account. Signing in is only needed at payment.",
        })}
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-16 sm:px-6" />}>
      <LoginForm />
    </Suspense>
  );
}
