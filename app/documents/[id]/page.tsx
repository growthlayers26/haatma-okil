import Link from "next/link";
import { notFound } from "next/navigation";
import { getDocument } from "@/app/actions/documents";
import { getTemplate } from "@/lib/templates";
import { DocumentPreview } from "@/components/document-preview";
import { DocumentActions } from "./document-actions";
import { ExecutionNotice } from "@/components/execution-notice";

/**
 * A purchased document, without the watermark.
 *
 * This is what the customer actually bought, and until it existed the purchase
 * changed nothing they could see.
 *
 * Access rests on two things, and it is worth being exact about them because one of
 * them used to be a database guarantee and no longer is. `getDocument` matches on
 * `customer_id`, and that predicate IS the ownership check now — row-level security
 * used to refuse the row regardless, and there is no such backstop on MySQL. The
 * status check below is the second: a draft is never served here, because an unmarked
 * draft is indistinguishable from a paid one once it leaves the screen.
 */
export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doc = await getDocument(id);
  if (!doc) notFound();

  const template = getTemplate(doc.templateSlug);
  if (!template) notFound();

  if (doc.status !== "purchased") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
        <div className="border-l-2 border-orpiment bg-surface p-6">
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Not yet purchased</h1>
          <p className="mt-3 text-ink-2">
            This document is still a draft. Complete the purchase and it becomes
            available here without the watermark.
          </p>
          <Link
            href={`/create/${doc.templateSlug}`}
            className="mt-5 inline-block bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Continue this document
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <DocumentActions templateSlug={doc.templateSlug} />
      <DocumentPreview template={template} answers={doc.answers} mode="full" />
      <ExecutionNotice template={template} />
    </div>
  );
}
