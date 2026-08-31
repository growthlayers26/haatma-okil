"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCustomerId } from "@/lib/auth/session";
import { call, execute, one, query } from "@/lib/db/mysql";
import { SERVICES, type ServiceId } from "@/lib/services";
import { consumeQuota, releaseQuota, linkQuotaToEnquiry } from "@/lib/quota";
import { queue } from "@/lib/notify";

/**
 * The advocate desk.
 *
 * An enquiry is assigned to one of the firm's practising advocates by practice area
 * with a load-balanced fallback — it is not escalated between tiers, because all
 * three are licensed counsel.
 *
 * Ordering matters here and is a professional-conduct requirement, not a UX choice:
 * the opposing party is collected and screened BEFORE the matter is described, so a
 * conflicted enquiry is refused before privileged detail enters the system.
 */

export type Advocate = {
  id: string;
  fullName: { ne: string; en: string };
  /** Null until the firm supplies it. Never rendered as a placeholder. */
  nbcLicence: string | null;
  /** Path under public/. Null renders the name alone rather than a broken image. */
  photoPath: string | null;
  practiceAreas: string[];
};

export type ConflictResult =
  | {
      cleared: true;
      enquiryId: string;
      advocate: Advocate | null;
      /** True when the subscriber's monthly allowance covered this matter. */
      coveredByPlan: boolean;
    }
  | { cleared: false; reason: "conflict" | "unauthenticated" | "not_configured" | "error" };

type AdvocateRow = {
  id: string;
  full_name_ne: string;
  full_name_en: string;
  nbc_licence: string | null;
  photo_path: string | null;
  practice_areas: string[] | string | null;
};

function toAdvocate(row: AdvocateRow): Advocate {
  let areas: string[] = [];
  if (Array.isArray(row.practice_areas)) areas = row.practice_areas;
  else if (typeof row.practice_areas === "string") {
    try {
      areas = JSON.parse(row.practice_areas) as string[];
    } catch {
      areas = [];
    }
  }

  return {
    id: row.id,
    fullName: { ne: row.full_name_ne, en: row.full_name_en },
    nbcLicence: row.nbc_licence,
    photoPath: row.photo_path,
    practiceAreas: areas,
  };
}

export async function listAdvocates(): Promise<Advocate[]> {
  const rows = await query<AdvocateRow>(
    `SELECT id, full_name_ne, full_name_en, nbc_licence, practice_areas, photo_path
       FROM legal_advocates
      WHERE active = 1
      ORDER BY created_at`,
  );

  return rows.map(toAdvocate);
}

const ScreenSchema = z.object({
  areaOfLaw: z.string().min(1),
  opposingParty: z.string().trim().min(1).max(200),
  kind: z.enum(["question", "consultation", "document_review"]),
  documentId: z.string().uuid().optional(),
});

/**
 * Step one: screen for conflict, then open the matter.
 *
 * The check is deliberately conservative — if the named opposing party resembles an
 * existing client of the firm, the enquiry is declined rather than assigned. A false
 * positive costs one enquiry; a false negative is a professional-conduct breach.
 *
 * REVIEW: this matches against existing client names only. Before launch it must also
 * read the firm's own conflict register, which lives outside this system today. A
 * clash with a matter the firm took on paper will not be caught here.
 */
export async function screenConflict(input: {
  areaOfLaw: string;
  opposingParty: string;
  kind: ServiceId;
  documentId?: string;
}): Promise<ConflictResult> {
  const parsed = ScreenSchema.safeParse(input);
  if (!parsed.success) return { cleared: false, reason: "error" };

  const customerId = await getCustomerId();
  if (!customerId) return { cleared: false, reason: "unauthenticated" };

  const { areaOfLaw, opposingParty, kind, documentId } = parsed.data;

  // Escape LIKE wildcards so a party name containing % or _ can't widen the match.
  const needle = opposingParty.replace(/[%_\\]/g, (c) => `\\${c}`);

  const clash = await one<{ id: number }>(
    `SELECT id FROM customers
      WHERE CONCAT_WS(' ', first_name, last_name) LIKE ?
      LIMIT 1`,
    [needle],
  );

  if (clash) {
    await execute(
      `INSERT INTO legal_enquiries
         (id, customer_id, area_of_law, opposing_party, kind, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'declined', NOW(), NOW())`,
      [randomUUID(), customerId, areaOfLaw, opposingParty, kind],
    );
    return { cleared: false, reason: "conflict" };
  }

  const assignedId = await call<string>("legal_assign_advocate", [areaOfLaw]);

  /*
   * Try to cover this from the subscriber's monthly allowance.
   *
   * A live consultation is deliberately never metered — it occupies an advocate's
   * diary rather than a slice of their writing time, so it is always billed.
   *
   * A null here is the ordinary path, not a failure: it means bill per matter.
   */
  const quotaKind = kind === "question" ? "question" : kind === "document_review" ? "review" : null;
  const usageId = quotaKind ? await consumeQuota(customerId, quotaKind) : null;
  const coveredByPlan = usageId !== null;

  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + (kind === "consultation" ? 3 : kind === "document_review" ? 2 : 1));

  const enquiryId = randomUUID();

  try {
    await execute(
      `INSERT INTO legal_enquiries
         (id, customer_id, document_id, advocate_id, area_of_law, opposing_party, kind,
          status, conflict_cleared_at, due_at, covered_by_plan, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'screening', NOW(), ?, ?, NOW(), NOW())`,
      [
        enquiryId,
        customerId,
        documentId ?? null,
        assignedId,
        areaOfLaw,
        opposingParty,
        kind,
        dueAt,
        coveredByPlan,
      ],
    );
  } catch {
    // The unit was taken before the matter existed. Since the matter could not be
    // opened, hand it back rather than charging a subscriber for nothing.
    if (usageId) await releaseQuota(usageId);
    return { cleared: false, reason: "error" };
  }

  if (usageId) await linkQuotaToEnquiry(usageId, enquiryId);

  const advocates = await listAdvocates();
  const advocate = advocates.find((a) => a.id === assignedId) ?? null;

  revalidatePath("/dashboard");
  return { cleared: true, enquiryId, advocate, coveredByPlan };
}

const DetailSchema = z.object({
  enquiryId: z.string().uuid(),
  question: z.string().trim().min(10).max(5000),
});

/**
 * Step two: attach the matter detail.
 *
 * Refuses unless conflict screening has already cleared, so no path exists that
 * stores privileged detail on an unscreened enquiry.
 */
export async function submitEnquiryDetail(input: {
  enquiryId: string;
  question: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const parsed = DetailSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };

  const customerId = await getCustomerId();
  if (!customerId) return { ok: false, reason: "unauthenticated" };

  const updated = await execute(
    `UPDATE legal_enquiries
        SET question = ?, status = 'assigned', updated_at = NOW()
      WHERE id = ? AND customer_id = ? AND status = 'screening'
        AND conflict_cleared_at IS NOT NULL`,
    [parsed.data.question, parsed.data.enquiryId, customerId],
  );

  if (updated === 0) return { ok: false, reason: "not_screened" };

  /*
   * Tell the advocate. Deliberately after the update and never awaited into the
   * result: the matter is saved either way, and a notification that cannot be
   * written must not fail a submission the client has already paid for.
   */
  void notifyAdvocateOfMatter(parsed.data.enquiryId);

  revalidatePath("/dashboard");
  return { ok: true };
}

/** Queue the "new matter" message for whichever advocate holds it. */
async function notifyAdvocateOfMatter(enquiryId: string): Promise<void> {
  const row = await one<{
    kind: string;
    area_of_law: string;
    due_at: string | null;
    email: string | null;
  }>(
    `SELECT e.kind, e.area_of_law, e.due_at, a.email
       FROM legal_enquiries e
       JOIN legal_advocates a ON a.id = e.advocate_id
      WHERE e.id = ?`,
    [enquiryId],
  );

  if (!row?.email) return;

  await queue({
    channel: "email",
    recipient: row.email,
    kind: "matter_assigned",
    subject: "A new matter is waiting on the desk",
    body:
      `A ${row.kind.replace(/_/g, " ")} in ${row.area_of_law} has been ` +
      `assigned to you${row.due_at ? `, due ${new Date(row.due_at).toDateString()}` : ""}.\n\n` +
      `Open the desk to read and answer it.`,
    enquiryId,
  });
}

export type ClientEnquiry = {
  id: string;
  kind: ServiceId;
  areaOfLaw: string;
  status: "screening" | "assigned" | "answered" | "declined";
  question: string | null;
  answer: string | null;
  dueAt: string | null;
  advocate: Advocate | null;
};

export async function listMyEnquiries(): Promise<ClientEnquiry[]> {
  const customerId = await getCustomerId();
  if (!customerId) return [];

  const rows = await query<{
    id: string;
    kind: ServiceId;
    area_of_law: string;
    status: ClientEnquiry["status"];
    question: string | null;
    answer: string | null;
    due_at: string | null;
    advocate_id: string | null;
  }>(
    `SELECT id, kind, area_of_law, status, question, answer, due_at, advocate_id
       FROM legal_enquiries
      WHERE customer_id = ?
      ORDER BY created_at DESC`,
    [customerId],
  );

  const advocates = await listAdvocates();

  return rows.map((e) => ({
    id: e.id,
    kind: e.kind,
    areaOfLaw: e.area_of_law,
    status: e.status,
    question: e.question,
    answer: e.answer,
    dueAt: e.due_at,
    advocate: advocates.find((a) => a.id === e.advocate_id) ?? null,
  }));
}

export async function priceOf(kind: ServiceId): Promise<number> {
  return SERVICES[kind].priceNpr;
}
