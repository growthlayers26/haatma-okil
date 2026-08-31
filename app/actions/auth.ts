"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCustomer, register, signIn, signOut, type Customer } from "@/lib/auth/session";

/**
 * Signing in.
 *
 * This moved from an emailed one-time link to email and password when identity moved
 * to Bagisto, and the change is worth stating rather than discovering. The original
 * reasoning was that password handling is the largest security liability a small firm
 * can take on and a link bought the same thing for less risk. That argument is much
 * weaker now: the hashing, the account states and the reset flow are Laravel's and
 * Bagisto's, not this codebase's, and they are mature.
 *
 * What is genuinely lost is that a one-time link suits the Nepali market — many
 * clients will not want another password. Bagisto can be given a magic-link guard
 * later, and that is where it would go: in Bagisto, next to the other credentials,
 * rather than as a second identity system here.
 */

const Credentials = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const Registration = z.object({
  firstName: z.string().trim().min(1).max(255),
  lastName: z.string().trim().max(255).optional(),
  email: z.string().trim().email(),
  password: z.string().min(8, "too_short"),
  phone: z.string().trim().max(255).optional(),
});

export type AuthActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function signInAction(input: unknown): Promise<AuthActionResult> {
  const parsed = Credentials.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const result = await signIn(parsed.data.email, parsed.data.password);
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function registerAction(input: unknown): Promise<AuthActionResult> {
  const parsed = Registration.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "invalid" };
  }

  const result = await register(parsed.data);
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function signOutAction(): Promise<void> {
  await signOut();
  revalidatePath("/", "layout");
}

/** The signed-in customer, for client components that need to know. */
export async function currentCustomer(): Promise<Customer | null> {
  return getCustomer();
}
