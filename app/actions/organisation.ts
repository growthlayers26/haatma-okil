"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { PLANS, isPlanId, type PlanId } from "@/lib/plans";
import { OverlaySchema, validateOverlay, type Overlay } from "@/lib/org-templates";

/**
 * Organisations, seats and the approval queue.
 *
 * Anything that grants entitlement — creating an organisation, taking a seat,
 * approving a document — runs through the service role and a database function, for
 * the same reason subscriptions do: a client session must not be able to widen what
 * an account is allowed to do.
 */

export type OrgRole = "owner" | "admin" | "member";

export type OrgState = {
  id: string;
  name: string;
  role: OrgRole;
  requireApproval: boolean;
  seatsUsed: number;
  seatsTotal: number;
  /** Plan entitlements, taken from the owner's subscription. */
  canUseApproval: boolean;
  canUseCustomTemplates: boolean;
};

/** The plan behind an organisation is always its owner's. */
async function ownerPlan(ownerId: string): Promise<PlanId> {
  const service = createServiceClient();
  if (!service) return "free";

  const { data } = await service
    .from("subscriptions")
    .select("plan_id, status, current_period_end")
    .eq("user_id", ownerId)
    .eq("status", "active")
    .maybeSingle();

  if (!data) return "free";
  const end = data.current_period_end as string | null;
  if (end && new Date(end).getTime() <= Date.now()) return "free";

  return isPlanId(data.plan_id as string) ? (data.plan_id as PlanId) : "free";
}

export async function getMyOrg(): Promise<OrgState | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id, role, organisations(id, name, owner_id, require_approval)")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (!membership?.organisations) return null;

  const org = membership.organisations as unknown as {
    id: string;
    name: string;
    owner_id: string;
    require_approval: boolean;
  };

  const service = createServiceClient();
  const [{ count }, plan, seats] = await Promise.all([
    service
      ? service.from("memberships").select("id", { count: "exact", head: true }).eq("org_id", org.id)
      : Promise.resolve({ count: 0 }),
    ownerPlan(org.owner_id),
    service
      ? service
          .from("subscriptions")
          .select("seats")
          .eq("user_id", org.owner_id)
          .maybeSingle()
          .then((r) => Number(r.data?.seats ?? 1))
      : Promise.resolve(1),
  ]);

  const entitlements = PLANS[plan].entitlements;

  return {
    id: org.id,
    name: org.name,
    role: membership.role as OrgRole,
    requireApproval: org.require_approval,
    seatsUsed: count ?? 0,
    seatsTotal: seats,
    canUseApproval: entitlements.approvalWorkflow,
    canUseCustomTemplates: entitlements.customTemplates,
  };
}

export async function createOrganisation(
  name: string,
): Promise<{ ok: true; orgId: string } | { ok: false; reason: string }> {
  const parsed = z.string().trim().min(2).max(120).safeParse(name);
  if (!parsed.success) return { ok: false, reason: "invalid_name" };

  const supabase = await createClient();
  const service = createServiceClient();
  if (!supabase || !service) return { ok: false, reason: "not_configured" };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, reason: "unauthenticated" };

  // A one-seat plan is a single user by definition; an organisation would be an
  // empty shell that can never admit anyone.
  const plan = await ownerPlan(auth.user.id);
  if (PLANS[plan].entitlements.seats < 2) return { ok: false, reason: "plan_has_no_seats" };

  const { data: existing } = await service
    .from("memberships")
    .select("id")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (existing) return { ok: false, reason: "already_in_organisation" };

  const { data, error } = await service.rpc("create_organisation", {
    p_owner: auth.user.id,
    p_name: parsed.data,
  });
  if (error || !data) return { ok: false, reason: "error" };

  revalidatePath("/team");
  return { ok: true, orgId: data as string };
}

/**
 * Seat someone who already has an account.
 *
 * Deliberately does not create accounts or email invitations. Adding a seat is a
 * billing event, and silently provisioning a login for an address someone typed is
 * how the wrong person ends up inside a firm's document store.
 */
export async function addMember(
  email: string,
  role: OrgRole = "member",
): Promise<{ ok: boolean; reason: string }> {
  const parsed = z.string().trim().email().safeParse(email);
  if (!parsed.success) return { ok: false, reason: "invalid_email" };

  const org = await getMyOrg();
  if (!org) return { ok: false, reason: "no_organisation" };
  if (org.role === "member") return { ok: false, reason: "not_permitted" };

  const service = createServiceClient();
  if (!service) return { ok: false, reason: "not_configured" };

  const { data: found } = await service.auth.admin.listUsers();
  const target = found?.users.find(
    (u) => u.email?.toLowerCase() === parsed.data.toLowerCase(),
  );
  if (!target) return { ok: false, reason: "no_such_user" };

  const { data, error } = await service.rpc("add_org_member", {
    p_org: org.id,
    p_user: target.id,
    p_role: role,
  });
  if (error) return { ok: false, reason: "error" };

  revalidatePath("/team");
  return { ok: data === "ok", reason: (data as string) ?? "error" };
}

export async function setRequireApproval(on: boolean): Promise<{ ok: boolean; reason?: string }> {
  const org = await getMyOrg();
  if (!org) return { ok: false, reason: "no_organisation" };
  if (org.role !== "owner") return { ok: false, reason: "not_permitted" };
  if (on && !org.canUseApproval) return { ok: false, reason: "not_in_plan" };

  const supabase = await createClient();
  if (!supabase) return { ok: false, reason: "not_configured" };

  const { error } = await supabase
    .from("organisations")
    .update({ require_approval: on })
    .eq("id", org.id);

  revalidatePath("/team");
  return { ok: !error };
}

/* ------------------------------------------------------------------ approval */

export type QueuedDocument = {
  id: string;
  templateSlug: string;
  status: string;
  approvalStatus: string;
  updatedAt: string;
};

export async function listApprovalQueue(): Promise<QueuedDocument[]> {
  const org = await getMyOrg();
  if (!org || org.role === "member") return [];

  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("documents")
    .select("id, template_slug, status, approval_status, updated_at")
    .eq("org_id", org.id)
    .eq("approval_status", "pending")
    .order("updated_at", { ascending: true });

  return (data ?? []).map((d) => ({
    id: d.id as string,
    templateSlug: d.template_slug as string,
    status: d.status as string,
    approvalStatus: d.approval_status as string,
    updatedAt: d.updated_at as string,
  }));
}

export async function submitForApproval(documentId: string): Promise<{ ok: boolean; reason?: string }> {
  const org = await getMyOrg();
  if (!org) return { ok: false, reason: "no_organisation" };

  const supabase = await createClient();
  if (!supabase) return { ok: false, reason: "not_configured" };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, reason: "unauthenticated" };

  const { data, error } = await supabase
    .from("documents")
    .update({ org_id: org.id, approval_status: "pending" })
    .eq("id", documentId)
    .eq("user_id", auth.user.id)
    .eq("status", "draft")
    .select("id")
    .maybeSingle();

  if (error || !data) return { ok: false, reason: "not_found" };

  revalidatePath("/team");
  return { ok: true };
}

export async function decideDocument(
  documentId: string,
  approve: boolean,
  note?: string,
): Promise<{ ok: boolean; reason: string }> {
  const supabase = await createClient();
  const service = createServiceClient();
  if (!supabase || !service) return { ok: false, reason: "not_configured" };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false, reason: "unauthenticated" };

  const { data, error } = await service.rpc("decide_document", {
    p_document: documentId,
    p_actor: auth.user.id,
    p_approve: approve,
    p_note: note ?? null,
  });
  if (error) return { ok: false, reason: "error" };

  revalidatePath("/team");
  return { ok: data === "ok", reason: (data as string) ?? "error" };
}

/* ------------------------------------------------------------------ templates */

export async function listOrgTemplates(): Promise<(Overlay & { id: string })[]> {
  const org = await getMyOrg();
  if (!org) return [];

  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("org_templates")
    .select("id, base_slug, name, default_answers, extra_clauses")
    .eq("org_id", org.id)
    .order("created_at");

  return (data ?? []).map((t) => ({
    id: t.id as string,
    baseSlug: t.base_slug as string,
    name: t.name as string,
    defaultAnswers: (t.default_answers ?? {}) as Overlay["defaultAnswers"],
    extraClauses: (t.extra_clauses ?? []) as Overlay["extraClauses"],
  }));
}

export async function createOrgTemplate(
  input: unknown,
): Promise<{ ok: boolean; reason: string; problems?: string[] }> {
  const org = await getMyOrg();
  if (!org) return { ok: false, reason: "no_organisation" };
  if (org.role === "member") return { ok: false, reason: "not_permitted" };
  if (!org.canUseCustomTemplates) return { ok: false, reason: "not_in_plan" };

  const parsed = OverlaySchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };

  // The base must exist in the code registry and the overlay must not shadow any of
  // its clauses — see lib/org-templates.ts for why that matters.
  const problems = validateOverlay(parsed.data);
  if (problems.length > 0) {
    return { ok: false, reason: "rejected", problems: problems.map((p) => `${p.code}:${p.detail}`) };
  }

  const supabase = await createClient();
  if (!supabase) return { ok: false, reason: "not_configured" };

  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from("org_templates").insert({
    org_id: org.id,
    base_slug: parsed.data.baseSlug,
    name: parsed.data.name,
    default_answers: parsed.data.defaultAnswers,
    extra_clauses: parsed.data.extraClauses,
    created_by: auth.user?.id ?? null,
  });

  revalidatePath("/team");
  return { ok: !error, reason: error ? "error" : "ok" };
}
