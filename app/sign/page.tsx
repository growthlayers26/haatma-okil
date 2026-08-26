import { listEnvelopes } from "@/app/actions/signing";
import { listDocuments } from "@/app/actions/documents";
import { SignClient } from "./sign-client";

export default async function SignPage() {
  const [envelopes, documents] = await Promise.all([listEnvelopes(), listDocuments()]);

  return (
    <SignClient
      envelopes={envelopes}
      // Only purchased documents can be sent for signature — an envelope over a
      // watermarked draft would circulate a specimen.
      documents={documents
        .filter((d) => d.status === "purchased")
        .map((d) => ({ id: d.id, templateSlug: d.templateSlug }))}
    />
  );
}
