import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signInWithGoogleProfile } from "@/lib/auth/session";
import { GOOGLE_STATE_COOKIE } from "../route";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

type StoredState = { state: string; next: string };

function failure(request: Request, reason: string): NextResponse {
  return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(reason)}`, request.url));
}

/**
 * Where Google sends the browser back to.
 *
 * Everything this route learns about who signed in comes from two server-to-server
 * calls it makes itself — the code exchange and the profile fetch — never from a
 * query parameter or a cookie the browser could have written. `code` only proves
 * Google authenticated *someone*; exchanging it for a profile is what proves who.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");

  const cookieStore = await cookies();
  const raw = cookieStore.get(GOOGLE_STATE_COOKIE)?.value;
  cookieStore.delete(GOOGLE_STATE_COOKIE);

  let stored: StoredState | null = null;
  try {
    stored = raw ? (JSON.parse(raw) as StoredState) : null;
  } catch {
    stored = null;
  }

  // Also refuses a request with no code at all — Google sends `error` instead of
  // `code` when the visitor declines consent, which lands here with code=null.
  if (!code || !returnedState || !stored || returnedState !== stored.state) {
    return failure(request, "google_failed");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!clientId || !clientSecret || !siteUrl) {
    return failure(request, "google_unavailable");
  }

  try {
    const tokenResponse = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        // Must match the value sent in the authorize request byte for byte — Google
        // checks this, not just the console's allow-list — so it is built the same way.
        redirect_uri: `${siteUrl}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    });

    const tokenPayload = (await tokenResponse.json().catch(() => null)) as {
      access_token?: string;
    } | null;

    if (!tokenResponse.ok || !tokenPayload?.access_token) {
      return failure(request, "google_failed");
    }

    const profileResponse = await fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
      cache: "no-store",
    });

    const profile = (await profileResponse.json().catch(() => null)) as {
      email?: string;
      email_verified?: boolean;
      given_name?: string;
      family_name?: string;
    } | null;

    // email_verified comes from Google, not from anything Google is relaying on the
    // visitor's say-so — but an unverified address is exactly the case a Google
    // account can be in, and signing someone in as its owner on that basis would be
    // the same mistake as skipping verification on a password account.
    if (!profileResponse.ok || !profile?.email || !profile.email_verified) {
      return failure(request, "google_failed");
    }

    const result = await signInWithGoogleProfile({
      email: profile.email,
      firstName: profile.given_name ?? profile.email.split("@")[0],
      lastName: profile.family_name ?? "",
    });

    if (!result.ok) {
      return failure(request, result.error);
    }

    return NextResponse.redirect(new URL(stored.next, request.url));
  } catch {
    return failure(request, "google_failed");
  }
}
