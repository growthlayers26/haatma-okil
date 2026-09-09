"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/language-provider";
import { signInDeskAction } from "@/app/actions/auth";

/**
 * The advocate's way in.
 *
 * Separate from the client sign-in because it is a different account: advocates are
 * firm staff, held as Bagisto admins, and the desk reads its own cookie. Sending them
 * to the client login — which is what the desk used to do — signed them in
 * successfully as a customer and returned them to a page still asking them to sign
 * in, with nothing on screen to explain the loop.
 *
 * Deliberately not linked from the public header. This is a staff door, and putting
 * it in the client navigation invites people to try a login they cannot have.
 */
export default function DeskLoginPage() {
  const { bi } = useLang();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "working" | "error">("idle");
  const [message, setMessage] = useState("");

  function explain(error: string): string {
    switch (error) {
      case "invalid_credentials":
        return bi({
          ne: "इमेल वा पासवर्ड मिलेन।",
          en: "That email and password do not match a staff account.",
        });
      case "inactive":
        return bi({ ne: "यो खाता सक्रिय छैन।", en: "This staff account is not active." });
      case "unavailable":
        return bi({
          ne: "सेवा अहिले उपलब्ध छैन। केही बेरमा फेरि प्रयास गर्नुहोस्।",
          en: "The service is unreachable right now. Try again shortly.",
        });
      default:
        return error;
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("working");

    const result = await signInDeskAction({ email, password });

    if (!result.ok) {
      setState("error");
      setMessage(explain(result.error));
      return;
    }

    router.push("/desk");
    router.refresh();
  }

  const inputClass =
    "mt-1.5 w-full border border-rule-strong bg-surface px-3 py-2.5 text-base outline-none transition-colors focus:border-accent";

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-wider text-accent">
        {bi({ ne: "फर्मका कर्मचारी", en: "Firm staff" })}
      </p>
      <h1 className="mt-2 font-serif text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
        {bi({ ne: "अधिवक्ता डेस्क", en: "Advocate desk" })}
      </h1>
      <p className="mt-2 text-ink-2">
        {bi({
          ne: "फर्मले दिएको कर्मचारी खाताबाट लगइन गर्नुहोस्। यो ग्राहक खाताभन्दा फरक हो।",
          en: "Sign in with the staff account the firm issued you. This is not the same as a client account.",
        })}
      </p>

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
            autoComplete="current-password"
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
          {state === "working" ? "…" : bi({ ne: "डेस्क खोल्नुहोस्", en: "Open the desk" })}
        </button>

        {state === "error" && (
          <p className="border-l-2 border-cinnabar bg-surface p-3 text-sm text-cinnabar" role="alert">
            {message}
          </p>
        )}
      </form>

      <p className="mt-8 border-t border-rule pt-4 text-sm text-ink-3">
        {bi({
          ne: "यो पृष्ठ ग्राहकका लागि होइन। ग्राहकले आफ्नो खाताबाट लगइन गर्नुहोस्।",
          en: "This page is not for clients. If you are a client, sign in from the main site instead.",
        })}
      </p>
    </div>
  );
}
