import "server-only";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { one, type Param } from "@/lib/db/mysql";

/**
 * Who is signed in.
 *
 * Bagisto owns identity. Signing in posts to its endpoint, which is the only place a
 * password is ever compared and the only place the three states that should stop
 * someone getting in — unverified, suspended, deactivated — are checked. What comes
 * back is a Sanctum token, which this module stores in an httpOnly cookie.
 *
 * Reading the session afterwards does not call PHP. Sanctum stores `sha256(secret)`
 * against a row id, so verifying a token is a hash and one indexed lookup in the same
 * database this application is already connected to. A round trip per request would
 * buy nothing.
 */

export const SESSION_COOKIE = "haatmaokil.session";

/**
 * The advocate desk signs in separately.
 *
 * Advocates are firm staff — Bagisto admins, not customers — and a separate cookie
 * keeps the two apart. One person could legitimately be both, and a single cookie
 * would make "which of my two hats am I wearing" depend on which token was written
 * last.
 */
export const DESK_COOKIE = "haatmaokil.desk";

const CUSTOMER_TYPE = "Webkul\\Customer\\Models\\Customer";

const ADMIN_TYPE = "Webkul\\User\\Models\\Admin";

const BAGISTO_URL = process.env.BAGISTO_URL ?? "http://localhost";

export type Customer = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isVerified: boolean;
};

type CustomerRow = {
  id: number;
  first_name: string;
  last_name: string | null;
  email: string;
  phone: string | null;
  is_verified: number;
  status: number;
  is_suspended: number;
};

/**
 * The signed-in customer, or null.
 *
 * Re-checks `status` and `is_suspended` on every read rather than trusting the token.
 * A token issued before an account was suspended is otherwise still valid, and for a
 * law firm the gap between "we suspended this account" and "they stopped being able
 * to open their matters" should not be the length of a session.
 */
export async function getCustomer(): Promise<Customer | null> {
  const parsed = parseToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!parsed) return null;

  const row = await readOrNull<CustomerRow>(
    `SELECT c.id, c.first_name, c.last_name, c.email, c.phone,
            c.is_verified, c.status, c.is_suspended
       FROM personal_access_tokens t
       JOIN customers c ON c.id = t.tokenable_id
      WHERE t.id = ? AND t.token = ? AND t.tokenable_type = ?`,
    [parsed.id, parsed.hash, CUSTOMER_TYPE],
  );

  if (!row || row.is_suspended || !row.status) return null;

  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name ?? "",
    email: row.email,
    phone: row.phone,
    isVerified: Boolean(row.is_verified),
  };
}

/** The signed-in customer's id, or null. The form most callers actually want. */
export async function getCustomerId(): Promise<number | null> {
  return (await getCustomer())?.id ?? null;
}

export type DeskUser = {
  adminId: number;
  name: string;
  email: string;
  /** Null when this staff account has no advocate record — see getDesk. */
  advocateId: string | null;
};

/**
 * Read one row, treating an unreachable database as "not signed in".
 *
 * This is called from the root layout, so an exception here does not fail one page —
 * it fails every page, including the anonymous drafting flow that is supposed to work
 * with no database at all. A signed-in visitor was getting a 500 on the whole site the
 * moment MySQL blinked, which is precisely backwards: the person with an account got a
 * worse outage than the person without one.
 *
 * Degrading to signed-out is also the safe direction. It shows less rather than more,
 * and no access decision is made on the strength of a failed lookup.
 *
 * Deliberately narrow: only session resolution swallows the error. Server actions
 * still throw, because there "the database is down" is something the caller needs to
 * hear rather than quietly treat as an empty result.
 */
async function readOrNull<T>(sql: string, params: Param[]): Promise<T | null> {
  try {
    return await one<T>(sql, params);
  } catch (error) {
    console.error("[session] could not reach the database:", error);
    return null;
  }
}

/** Splits a Sanctum token into its row id and the secret to hash against. */
function parseToken(token: string | undefined): { id: number; hash: string } | null {
  if (!token) return null;

  const separator = token.indexOf("|");
  if (separator < 1) return null;

  const id = Number(token.slice(0, separator));
  const secret = token.slice(separator + 1);
  if (!Number.isInteger(id) || !secret) return null;

  return { id, hash: createHash("sha256").update(secret).digest("hex") };
}

/** The signed-in advocate, or null. */
export async function getDeskUser(): Promise<DeskUser | null> {
  const parsed = parseToken((await cookies()).get(DESK_COOKIE)?.value);
  if (!parsed) return null;

  const row = await readOrNull<{
    id: number;
    name: string;
    email: string;
    status: number;
    advocate_id: string | null;
  }>(
    `SELECT a.id, a.name, a.email, a.status, adv.id AS advocate_id
       FROM personal_access_tokens t
       JOIN admins a ON a.id = t.tokenable_id
       LEFT JOIN legal_advocates adv ON adv.admin_id = a.id
      WHERE t.id = ? AND t.token = ? AND t.tokenable_type = ?`,
    [parsed.id, parsed.hash, ADMIN_TYPE],
  );

  if (!row || !row.status) return null;

  return {
    adminId: row.id,
    name: row.name,
    email: row.email,
    advocateId: row.advocate_id,
  };
}

/** Sign an advocate in against their Bagisto staff account. */
export async function signInDesk(
  email: string,
  password: string,
): Promise<{ ok: true; user: DeskUser } | { ok: false; error: string }> {
  let response: Response;

  try {
    response = await fetch(`${BAGISTO_URL}/api/legal/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
  } catch {
    return { ok: false, error: "unavailable" };
  }

  const payload = (await response.json().catch(() => null)) as {
    token?: string;
    admin?: { id: number; name: string; email: string; advocate_id: string | null };
    error?: string;
  } | null;

  if (!response.ok || !payload?.token || !payload.admin) {
    return { ok: false, error: payload?.error ?? "invalid_credentials" };
  }

  (await cookies()).set(DESK_COOKIE, payload.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });

  return {
    ok: true,
    user: {
      adminId: payload.admin.id,
      name: payload.admin.name,
      email: payload.admin.email,
      advocateId: payload.admin.advocate_id,
    },
  };
}

export async function signOutDesk(): Promise<void> {
  (await cookies()).delete(DESK_COOKIE);
}

type AuthResult =
  | { ok: true; customer: Customer }
  | { ok: false; error: "invalid_credentials" | "suspended" | "inactive" | "unavailable" | string };

/** Sign in against Bagisto and store the returned token. */
export async function signIn(email: string, password: string): Promise<AuthResult> {
  return authenticate("login", { email, password });
}

/** Create a Bagisto customer and sign them in. */
export async function register(input: {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<AuthResult> {
  return authenticate("register", {
    first_name: input.firstName,
    last_name: input.lastName ?? "",
    email: input.email,
    password: input.password,
    ...(input.phone ? { phone: input.phone } : {}),
  });
}

export async function signOut(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

async function authenticate(
  path: "login" | "register",
  body: Record<string, string>,
): Promise<AuthResult> {
  let response: Response;

  try {
    response = await fetch(`${BAGISTO_URL}/api/legal/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    // Bagisto is not reachable. Reported as its own case so the sign-in form can say
    // the service is down rather than implying the password was wrong.
    return { ok: false, error: "unavailable" };
  }

  const payload = (await response.json().catch(() => null)) as {
    token?: string;
    customer?: { id: number; first_name: string; last_name: string; email: string; phone: string | null; is_verified: boolean };
    error?: string;
    message?: string;
  } | null;

  if (!response.ok || !payload?.token || !payload.customer) {
    return { ok: false, error: payload?.error ?? payload?.message ?? "invalid_credentials" };
  }

  (await cookies()).set(SESSION_COOKIE, payload.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    // Matches Sanctum's default expiry being unset: the token lives until sign-out or
    // until a new sign-in replaces it.
    maxAge: 60 * 60 * 24 * 30,
  });

  return {
    ok: true,
    customer: {
      id: payload.customer.id,
      firstName: payload.customer.first_name,
      lastName: payload.customer.last_name ?? "",
      email: payload.customer.email,
      phone: payload.customer.phone,
      isVerified: Boolean(payload.customer.is_verified),
    },
  };
}
