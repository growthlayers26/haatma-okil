import { getDesk } from "@/app/actions/desk";
import { DeskClient } from "./desk-client";

/**
 * Fetched server-side so the matter list is never a stale client copy — two
 * advocates share this queue and one answering should not leave the other looking
 * at work that is already done.
 */
export default async function DeskPage() {
  const desk = await getDesk();
  return <DeskClient desk={desk} />;
}
