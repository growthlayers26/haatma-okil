"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/templates";
import type { Answers } from "@/lib/types";

/**
 * Document persistence.
 *
 * localStorage remains the working store during drafting: it is instant, it works
 * before sign-in, and it survives the app switch that Khalti and eSewa force during
 * payment. These actions add the durable copy — the one that survives a cleared
 * browser or a different device.
 */

export type SavedDocument = {
  id: string;
  templateSlug: string;
  answers: Answers;
  status: "draft" | "purchased";
  updatedAt: string;
};

const AnswersSchema = z.record(z.string(), z.union([z.string(), z.number()]).optional());

const SaveSchema = z.object({
  id: z.string().uuid().optional(),
  templateSlug: z.string().min(1),
  answers: AnswersSchema,
});

export async function saveDocument(input: {
  id?: string;
  templateSlug: string;
  answers: Answers;
}): Promise<{ ok: true; id: string } | { ok: false; reason: string }> {
  const parsed = SaveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };

  // Reject unknown slugs so a caller can't create rows for templates that don't exist.
  if (!getTemplate(parsed.data.templateSlug)) return { ok: false, reason: "unknown_template" };

  const supabase = await createClient();
  if (!supabase) return { ok: false, reason: "not_configured" };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, reason: "unauthenticated" };

  const row = {
    user_id: auth.user.id,
    template_slug: parsed.data.templateSlug,
    answers: parsed.data.answers,
  };

  // A purchased document is immutable — editing it after payment would let a buyer
  // alter an instrument the firm has already put its name to.
  if (parsed.data.id) {
    const { data, error } = await supabase
      .from("documents")
      .update(row)
      .eq("id", parsed.data.id)
      .eq("user_id", auth.user.id)
      .eq("status", "draft")
      .select("id")
      .maybeSingle();

    if (error) return { ok: false, reason: error.message };
    if (data) {
      revalidatePath("/dashboard");
      return { ok: true, id: data.id };
    }
    // Fall through and insert if the update matched nothing.
  }

  const { data, error } = await supabase
    .from("documents")
    .insert(row)
    .select("id")
    .single();

  if (error) return { ok: false, reason: error.message };

  revalidatePath("/dashboard");
  return { ok: true, id: data.id };
}

export async function listDocuments(): Promise<SavedDocument[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];

  const { data, error } = await supabase
    .from("documents")
    .select("id, template_slug, answers, status, updated_at")
    .eq("user_id", auth.user.id)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];

  return data.map((d) => ({
    id: d.id as string,
    templateSlug: d.template_slug as string,
    answers: (d.answers ?? {}) as Answers,
    status: d.status as "draft" | "purchased",
    updatedAt: d.updated_at as string,
  }));
}

/**
 * Moves drafts made before sign-in onto the account.
 *
 * Called once after login. Skips any template that already has a server-side draft,
 * so signing in on a second device doesn't clobber work saved from the first.
 */
export async function claimLocalDrafts(
  drafts: { templateSlug: string; answers: Answers }[],
): Promise<{ claimed: number }> {
  const supabase = await createClient();
  if (!supabase) return { claimed: 0 };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { claimed: 0 };

  const existing = await listDocuments();
  const alreadyHeld = new Set(existing.map((d) => d.templateSlug));

  const toInsert = drafts
    .filter((d) => getTemplate(d.templateSlug))
    .filter((d) => Object.keys(d.answers).length > 0)
    .filter((d) => !alreadyHeld.has(d.templateSlug))
    .map((d) => ({
      user_id: auth.user!.id,
      template_slug: d.templateSlug,
      answers: d.answers,
    }));

  if (toInsert.length === 0) return { claimed: 0 };

  const { error } = await supabase.from("documents").insert(toInsert);
  if (error) return { claimed: 0 };

  revalidatePath("/dashboard");
  return { claimed: toInsert.length };
}

export async function deleteDocument(id: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  if (!supabase) return { ok: false };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false };

  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .eq("status", "draft");

  revalidatePath("/dashboard");
  return { ok: !error };
}
