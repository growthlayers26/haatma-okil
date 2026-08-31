"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCustomerId } from "@/lib/auth/session";
import { call, execute, one, query } from "@/lib/db/mysql";
import { PLANS, isPlanId, type PlanId } from "@/lib/plans";
import { OverlaySchema, validateOverlay, type Overlay } from "@/lib/org-templates";

/**
 * Organisations, seats and the approval queue.
 *
 * Anything that grants entitlement — creating an organisation, taking a seat,
 * approving a document — goes through a stored procedure rather than being assembled
 * here, for the same reason subscriptions do. The seat limit and the refusal to
 * approve your own draft are conduct rules, and they hold in the database whether or
 * not this file is correct.
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
async function ownerPlan(ownerId: number): Promise<PlanId> {
  const row = await one<{ plan_id: string; current_period_end: string | null }>(
    `SELECT plan_id, current_period_end
       FROM legal_subscriptions
      WHERE customer_id = ? AND status = 'active'`,
    [ownerId],
  );

  if (!row) return "free";
  if (row.current_period_end && new Date(row.current_period_end).getTime() <= Date.now()) {
    return "free";
  }

  return isPlanId(row.plan_id) ? (row.plan_id as PlanId) : "free";
}

export async function getMyOrg(): Promise<OrgState | null> {
  const customerId = await getCustomerId();
  if (!customerId) return null;

  const row = await one<{
    org_id: string;
    role: OrgRole;
    name: string;
    owner_id: number;
    require_approval: number;
    seats_used: number;
    seats_total: number | null;
  }>(
    `SELECT m.org_id, m.role, o.name, o.owner_id, o.require_approval,
            (SELECT COUNT(*) FROM legal_memberships x WHERE x.org_id = o.id) AS seats_used,
            (SELECT s.seats FROM legal_subscriptions s
              WHERE s.customer_id = o.owner_id AND s.status = 'active') AS seats_total
       FROM legal_memberships m
       JOIN legal_organisations o ON o.id = m.org_id
      WHERE m.customer_id = ?
      LIMIT 1`,
    [customerId],
  );

  if (!row) return null;

  const entitlements = PLANS[await ownerPlan(row.owner_id)].entitlements;

  return {
    id: row.org_id,
    name: row.name,
    role: row.role,
    requireApproval: Boolean(row.require_approval),
    seatsUsed: Number(row.seats_used ?? 0),
    seatsTotal: Number(row.seats_total ?? 1),
    canUseApproval: entitlements.approvalWorkflow,
    canUseCustomTemplates: entitlements.customTemplates,
  };
}

export async function createOrganisation(
  name: string,
): Promise<{ ok: true; orgId: string } | { ok: false; reason: string }> {
  const parsed = z.string().trim().min(2).max(120).safeParse(name);
  if (!parsed.success) return { ok: false, reason: "invalid_name" };

  const customerId = await getCustomerId();
  if (!customerId) return { ok: false, reason: "unauthenticated" };

  // A one-seat plan is a single user by definition; an organisation would be an
  // empty shell that can never admit anyone.
  const plan = await ownerPlan(customerId);
  if (PLANS[plan].entitlements.seats < 2) return { ok: false, reason: "plan_has_no_seats" };

  const existing = await one<{ id: string }>(
    `SELECT id FROM legal_memberships WHERE customer_id = ? LIMIT 1`,
    [customerId],
  );
  if (existing) return { ok: false, reason: "already_in_organisation" };

  const orgId = await call<string>("legal_create_organisation", [customerId, parsed.data]);
  if (!orgId) return { ok: false, reason: "error" };

  revalidatePath("/team");
  return { ok: true, orgId };
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

  const target = await one<{ id: number }>(`SELECT id FROM customers WHERE LOWER(email) = LOWER(?)`, [
    parsed.data,
  ]);
  if (!target) return { ok: false, reason: "no_such_user" };

  // The seat limit is checked inside the procedure, under a lock on the organisation
  // row — two admins inviting at once must not between them sell a seat twice.
  const result = await call<string>("legal_add_org_member", [org.id, target.id, role]);

  revalidatePath("/team");
  return { ok: result === "ok", reason: result ?? "error" };
}

export async function setRequireApproval(on: boolean): Promise<{ ok: boolean; reason?: string }> {
  const org = await getMyOrg();
  if (!org) return { ok: false, reason: "no_organisation" };
  if (org.role !== "owner") return { ok: false, reason: "not_permitted" };
  if (on && !org.canUseApproval) return { ok: false, reason: "not_in_plan" };

  const updated = await execute(
    `UPDATE legal_organisations SET require_approval = ?, updated_at = NOW() WHERE id = ?`,
    [on, org.id],
  );

  revalidatePath("/team");
  return { ok: updated > 0 };
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

  const rows = await query<{
    id: string;
    template_slug: string;
    status: string;
    approval_status: string;
    updated_at: string;
  }>(
    `SELECT id, template_slug, status, approval_status, updated_at
       FROM legal_documents
      WHERE org_id = ? AND approval_status = 'pending'
      ORDER BY updated_at ASC`,
    [org.id],
  );

  return rows.map((d) => ({
    id: d.id,
    templateSlug: d.template_slug,
    status: d.status,
    approvalStatus: d.approval_status,
    updatedAt: d.updated_at,
  }));
}

export async function submitForApproval(
  documentId: string,
): Promise<{ ok: boolean; reason?: string }> {
  const org = await getMyOrg();
  if (!org) return { ok: false, reason: "no_organisation" };

  const customerId = await getCustomerId();
  if (!customerId) return { ok: false, reason: "unauthenticated" };

  const updated = await execute(
    `UPDATE legal_documents
        SET org_id = ?, approval_status = 'pending', updated_at = NOW()
      WHERE id = ? AND customer_id = ? AND status = 'draft'`,
    [org.id, documentId, customerId],
  );

  if (updated === 0) return { ok: false, reason: "not_found" };

  revalidatePath("/team");
  return { ok: true };
}

export async function decideDocument(
  documentId: string,
  approve: boolean,
  note?: string,
): Promise<{ ok: boolean; reason: string }> {
  const customerId = await getCustomerId();
  if (!customerId) return { ok: false, reason: "unauthenticated" };

  /*
   * The procedure re-checks the caller's role and refuses self-approval. Both checks
   * could be done here, and neither is: someone with admin rights must not sign off
   * their own draft, and that has to hold even if this file is wrong about who is
   * asking.
   */
  const result = await call<string>("legal_decide_document", [
    documentId,
    customerId,
    approve,
    note ?? null,
  ]);

  revalidatePath("/team");
  return { ok: result === "ok", reason: result ?? "error" };
}

/* ------------------------------------------------------------------ templates */

export async function listOrgTemplates(): Promise<(Overlay & { id: string })[]> {
  const org = await getMyOrg();
  if (!org) return [];

  const rows = await query<{
    id: string;
    base_slug: string;
    name: string;
    default_answers: Overlay["defaultAnswers"] | string | null;
    extra_clauses: Overlay["extraClauses"] | string | null;
  }>(
    `SELECT id, base_slug, name, default_answers, extra_clauses
       FROM legal_org_templates
      WHERE org_id = ?
      ORDER BY created_at`,
    [org.id],
  );

  const parse = <T>(value: T | string | null, fallback: T): T => {
    if (value === null) return fallback;
    if (typeof value === "string") {
      try {
        return JSON.parse(value) as T;
      } catch {
        return fallback;
      }
    }
    return value;
  };

  return rows.map((t) => ({
    id: t.id,
    baseSlug: t.base_slug,
    name: t.name,
    defaultAnswers: parse(t.default_answers, {} as Overlay["defaultAnswers"]),
    extraClauses: parse(t.extra_clauses, [] as unknown as Overlay["extraClauses"]),
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

  const customerId = await getCustomerId();

  try {
    await execute(
      `INSERT INTO legal_org_templates
         (id, org_id, base_slug, name, default_answers, extra_clauses, created_by,
          created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        randomUUID(),
        org.id,
        parsed.data.baseSlug,
        parsed.data.name,
        JSON.stringify(parsed.data.defaultAnswers),
        JSON.stringify(parsed.data.extraClauses),
        customerId,
      ],
    );
  } catch {
    return { ok: false, reason: "error" };
  }

  revalidatePath("/team");
  return { ok: true, reason: "ok" };
}
