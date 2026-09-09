import "server-only";

import { randomUUID } from "node:crypto";
import { execute, query } from "@/lib/db/mysql";
import { FIRM } from "@/lib/firm";

/**
 * Outbound messages.
 *
 * Nothing used to be sent: an enquiry arrived silently, and a client had no way to
 * learn their answer was ready. All three advocates would have had to think to check.
 *
 * Messages are still recorded before they are dispatched, and that ordering is now
 * the point rather than a workaround. It began as one — there was no mail provider,
 * so queuing was the only honest thing the code could do. Bagisto supplies a real
 * mailer, and the queue is worth keeping anyway: a legal practice needs a record of
 * what it told a client and when, tied to the matter it concerned. Handing a message
 * to an SMTP server leaves no such record.
 */

export type Channel = "email" | "sms";

export type OutboundMessage = {
  channel: Channel;
  recipient: string;
  kind: string;
  subject: string;
  body: string;
  customerId?: number | null;
  enquiryId?: string | null;
  bagistoOrderId?: number | null;
  documentId?: string | null;
};

/**
 * What a provider adapter must satisfy.
 *
 * Written down so whoever wires up a second channel inherits the requirements.
 * Nepali SMS in particular is not a solved problem — Devanagari costs multiple
 * segments per message and some aggregators mangle it — so a sender that reports
 * success without confirming delivery is worse than none.
 */
export interface NotificationSender {
  readonly name: string;
  send(message: OutboundMessage): Promise<{ ok: true } | { ok: false; error: string }>;
}

const BAGISTO_URL = process.env.BAGISTO_URL ?? "http://localhost";

/**
 * Email through Bagisto's mailer.
 *
 * Bagisto holds the SMTP configuration — Mailpit locally, a real relay in production —
 * so the application does not need its own, and mail the firm sends from its admin
 * panel and mail it sends from here leave through the same route with the same
 * headers.
 *
 * SMS has no sender. That is deliberate: an aggregator that mangles Devanagari would
 * be worse than the silence, and choosing one is the firm's call, not a default.
 */
const bagistoEmail: NotificationSender = {
  name: "bagisto-smtp",

  async send(message) {
    if (message.channel !== "email") {
      return { ok: false, error: `no sender for channel: ${message.channel}` };
    }

    const secret = process.env.LEGAL_API_SECRET;
    if (!secret) return { ok: false, error: "LEGAL_API_SECRET is not set" };

    try {
      const response = await fetch(`${BAGISTO_URL}/api/legal/mail/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Legal-Secret": secret,
        },
        body: JSON.stringify({
          recipient: message.recipient,
          subject: message.subject,
          body: message.body,
          reply_to: SENDER_ADDRESS,
        }),
        cache: "no-store",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        return { ok: false, error: payload?.error ?? `HTTP ${response.status}` };
      }

      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "unreachable" };
    }
  },
};

/** The configured sender, or null when the shared secret has not been set. */
export function getSender(): NotificationSender | null {
  return process.env.LEGAL_API_SECRET ? bagistoEmail : null;
}

/**
 * The address everything is sent from, and replied to.
 *
 * A reply-to that nobody reads is worse than no email at all: someone answering a
 * notification about their own legal matter must reach the firm, not a void.
 */
export const SENDER_ADDRESS = FIRM.email;

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
  try {
    await execute(
      `INSERT INTO legal_notifications
         (id, customer_id, channel, recipient, kind, subject, body,
          enquiry_id, bagisto_order_id, document_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        randomUUID(),
        message.customerId ?? null,
        message.channel,
        message.recipient,
        message.kind,
        message.subject,
        message.body,
        message.enquiryId ?? null,
        message.bagistoOrderId ?? null,
        message.documentId ?? null,
      ],
    );
    return true;
  } catch {
    return false;
  }
}

export type DispatchReport = { attempted: number; sent: number; failed: number };

/**
 * Send what is queued.
 *
 * Called on a schedule alongside payment reconciliation. Each message records its own
 * failure rather than aborting the batch — one bad address must not hold up
 * everyone else's mail.
 */
export async function dispatchQueued(limit = 50): Promise<DispatchReport> {
  const report: DispatchReport = { attempted: 0, sent: 0, failed: 0 };

  const sender = getSender();
  if (!sender) return report;

  const pending = await query<{
    id: string;
    channel: Channel;
    recipient: string;
    kind: string;
    subject: string;
    body: string;
  }>(
    `SELECT id, channel, recipient, kind, subject, body
       FROM legal_notifications
      WHERE status = 'queued'
      ORDER BY created_at
      LIMIT ?`,
    [limit],
  );

  for (const row of pending) {
    report.attempted += 1;

    const result = await sender.send({
      channel: row.channel,
      recipient: row.recipient,
      kind: row.kind,
      subject: row.subject,
      body: row.body,
    });

    if (result.ok) {
      report.sent += 1;
      await execute(
        `UPDATE legal_notifications
            SET status = 'sent', sent_at = NOW(), attempts = attempts + 1, updated_at = NOW()
          WHERE id = ?`,
        [row.id],
      );
    } else {
      report.failed += 1;
      await execute(
        `UPDATE legal_notifications
            SET status = 'failed', error = ?, attempts = attempts + 1, updated_at = NOW()
          WHERE id = ?`,
        [result.error, row.id],
      );
    }
  }

  return report;
}
