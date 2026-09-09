"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLang } from "@/components/language-provider";
import { registerAction, signInAction } from "@/app/actions/auth";

/**
 * Sign in, or open an account.
 *
 * Email and password, because the account is a Bagisto customer account and that is
 * what Bagisto issues. The previous emailed one-time link is gone with the move — see
 * the note in app/actions/auth.ts for what that trades away and where a magic-link
 * guard would belong if the firm wants one back.
 */
function LoginForm() {
  const { bi, lang } = useLang();
  const router = useRouter();
  const params = useSearchParams();

  const next = params.get("next") ?? "/dashboard";
  // Only ever redirect within this origin — a supplied `next` must not be able to
  // bounce a freshly authenticated user to another host.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "working" | "error">("idle");
  const [message, setMessage] = useState("");

  function explain(error: string): string {
    switch (error) {
      case "invalid_credentials":
        return bi({
          ne: "इमेल वा पासवर्ड मिलेन।",
          en: "That email and password do not match an account.",
        });
      case "suspended":
        return bi({
          ne: "यो खाता निलम्बित छ। कृपया फर्मलाई सम्पर्क गर्नुहोस्।",
          en: "This account is suspended. Please contact the firm.",
        });
      case "inactive":
        return bi({ ne: "यो खाता सक्रिय छैन।", en: "This account is not active." });
      case "unavailable":
        return bi({
          ne: "सेवा अहिले उपलब्ध छैन। केही बेरमा फेरि प्रयास गर्नुहोस्।",
          en: "The service is unreachable right now. Try again shortly.",
        });
      case "too_short":
        return bi({
          ne: "पासवर्ड कम्तीमा ८ अक्षरको हुनुपर्छ।",
          en: "Choose a password of at least 8 characters.",
        });
      default:
        return error;
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("working");

    const result =
      mode === "signin"
        ? await signInAction({ email, password })
        : await registerAction({ firstName, lastName, email, password });

    if (!result.ok) {
      setState("error");
      setMessage(explain(result.error));
      return;
    }

    router.push(safeNext);
    router.refresh();
  }

  const inputClass =
    "mt-1.5 w-full border border-rule-strong bg-surface px-3 py-2.5 text-base outline-none transition-colors focus:border-accent";

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-serif text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
        {mode === "signin"
          ? bi({ ne: "लगइन गर्नुहोस्", en: "Sign in" })
          : bi({ ne: "खाता खोल्नुहोस्", en: "Open an account" })}
      </h1>
      <p className="mt-2 text-ink-2">
        {mode === "signin"
          ? bi({
              ne: "तपाईंको इमेल र पासवर्ड प्रयोग गर्नुहोस्।",
              en: "Use the email and password for your account.",
            })
          : bi({
              ne: "कागजात किन्न र वकिललाई सोध्न खाता चाहिन्छ।",
              en: "An account is needed to buy a document or ask an advocate.",
            })}
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        {mode === "register" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="block text-sm font-semibold">
                {bi({ ne: "नाम", en: "First name" })}
              </label>
              <input
                id="firstName"
                required
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-semibold">
                {bi({ ne: "थर", en: "Last name" })}
              </label>
              <input
                id="lastName"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        )}

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
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold">
            {bi({ ne: "पासवर्ड", en: "Password" })}
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={mode === "register" ? 8 : undefined}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            dir="ltr"
            lang="en"
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={state === "working"}
          className="w-full bg-accent px-5 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {state === "working"
            ? "…"
            : mode === "signin"
              ? bi({ ne: "लगइन", en: "Sign in" })
              : bi({ ne: "खाता खोल्नुहोस्", en: "Create account" })}
        </button>

        {state === "error" && (
          <p className="border-l-2 border-cinnabar bg-surface p-3 text-sm text-cinnabar" role="alert">
            {message}
          </p>
        )}
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signin" ? "register" : "signin");
          setState("idle");
        }}
        className="mt-6 text-sm text-accent underline underline-offset-4"
      >
        {mode === "signin"
          ? bi({ ne: "खाता छैन? खोल्नुहोस्।", en: "No account? Open one." })
          : bi({ ne: "पहिले नै खाता छ? लगइन गर्नुहोस्।", en: "Already have an account? Sign in." })}
      </button>

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
