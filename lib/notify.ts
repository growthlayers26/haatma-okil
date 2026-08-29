import { createServiceClient } from "@/lib/supabase/server";

/**
 * Outbound messages.
 *
 * Nothing was ever sent: an enquiry arrived silently, and a client had no way to
 * learn their answer was ready. Both advocates would have had to think to check.
 *
 * Messages are recorded before they are dispatched. With no provider connected the
 * queue simply fills and nothing is lost — which is why this is not a thin wrapper
 * around a provider call that would silently drop everything until one exists.
 */

export type Channel = "email" | "sms";

export type OutboundMessage = {
  channel: Channel;
  recipient: string;
  kind: string;
  subject: string;
  body: string;
  userId?: string | null;
  enquiryId?: string | null;
  orderId?: string | null;
  documentId?: string | null;
};

/**
 * What a provider adapter must satisfy.
 *
 * Written down so whoever wires up the chosen provider inherits the requirements.
 * Nepali SMS in particular is not a solved problem — Devanagari costs multiple
 * segments per message and some aggregators mangle it — so a sender that reports
 * success without confirming delivery is worse than none.
 */
export interface NotificationSender {
  readonly name: string;
  send(message: OutboundMessage): Promise<{ ok: true } | { ok: false; error: string }>;
}

/**
 * The configured sender.
 *
 * Null because no provider has been chosen. Every caller handles null, which is what
 * keeps delivery honestly unavailable rather than appearing to work.
 */
export function getSender(): NotificationSender | null {
  return null;
}

export function isDispatchConfigured(): boolean {
  return getSender() !== null;
}

/**
 * Record a message for delivery.
 *
 * Never throws and never blocks the thing that caused it: an advocate's answer must
 * save even if the notification cannot be written. Returns whether it was queued so
 * a caller can log, not so it can retry.
 */
export async function queue(message: OutboundMessage): Promise<boolean> {
  const supabase = createServiceClient();
  if (!supabase) return false;

  const { error } = await supabase.from("notifications").insert({
    user_id: message.userId ?? null,
    channel: message.channel,
    recipient: message.recipient,
    kind: message.kind,
    subject: message.subject,
    body: message.body,
    enquiry_id: message.enquiryId ?? null,
    order_id: message.orderId ?? null,
    document_id: message.documentId ?? null,
  });

  return !error;
}

export type DispatchReport = { attempted: number; sent: number; failed: number };

/**
 * Send what is queued.
 *
 * Called on a schedule alongside payment reconciliation. Each message records its
 * own failure rather than aborting the batch — one bad address must not hold up
 * everyone else's mail.
 */
export async function dispatchQueued(limit = 50): Promise<DispatchReport> {
  const report: DispatchReport = { attempted: 0, sent: 0, failed: 0 };
  const sender = getSender();
  const supabase = createServiceClient();
  if (!sender || !supabase) return report;

  const { data: pending } = await supabase
    .from("notifications")
    .select("id, channel, recipient, kind, subject, body")
    .eq("status", "queued")
    .order("created_at")
    .limit(limit);

  for (const row of pending ?? []) {
    report.attempted += 1;
    const result = await sender.send({
      channel: row.channel as Channel,
      recipient: row.recipient as string,
      kind: row.kind as string,
      subject: row.subject as string,
      body: row.body as string,
    });

    if (result.ok) {
      report.sent += 1;
      await supabase
        .from("notifications")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", row.id);
    } else {
      report.failed += 1;
      await supabase
        .from("notifications")
        .update({ status: "failed", error: result.error })
        .eq("id", row.id);
    }
  }

  return report;
}
