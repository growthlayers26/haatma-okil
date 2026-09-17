import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

const GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";

/** Carries the CSRF state and the post-login destination across the round trip through Google. */
export const GOOGLE_STATE_COOKIE = "haatmaokil.google_state";

/**
 * Starts Google sign-in.
 *
 * Redirects straight to Google — there is no form here, no password, nothing this
 * route itself decides about who the visitor is. That happens entirely at the
 * callback, once Google has authenticated them and handed back proof this route
 * never sees.
 *
 * `next` — where to land after sign-in — travels inside the same short-lived cookie
 * as the CSRF state rather than as a second query parameter carried through Google's
 * own redirect. Google echoes `state` back unmodified on the way back; folding `next`
 * into that one value means there is only one thing here to forge, not two.
 */
export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!clientId || !siteUrl) {
    return NextResponse.redirect(new URL("/login?error=google_unavailable", request.url));
  }

  const { searchParams } = new URL(request.url);
  const requested = searchParams.get("next") ?? "/dashboard";
  // Only ever redirect within this origin — see the same check in app/login/page.tsx.
  const next = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/dashboard";

  const state = randomBytes(24).toString("hex");

  const authorizeUrl = new URL(GOOGLE_AUTHORIZE_URL);
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", `${siteUrl}/api/auth/google/callback`);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "openid email profile");
  authorizeUrl.searchParams.set("state", state);
  // Lets a visitor with several Google accounts pick, rather than silently reusing
  // whichever one this browser last used somewhere else.
  authorizeUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(authorizeUrl);

  response.cookies.set(GOOGLE_STATE_COOKIE, JSON.stringify({ state, next }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    // Only needs to survive the round trip through Google's consent screen.
    maxAge: 60 * 10,
  });

  return response;
}
