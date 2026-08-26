import { getMyOrg, listApprovalQueue, listOrgTemplates } from "@/app/actions/organisation";
import { TeamClient } from "./team-client";

/**
 * Fetched on the server rather than in an effect.
 *
 * The mutations below all call revalidatePath("/team"), so a successful action
 * re-runs this component and the client receives fresh props — no client-side
 * refetch, no loading flash, and no stale copy of the roster held in state.
 */
export default async function TeamPage() {
  const org = await getMyOrg();

  const [queue, overlays] =
    org && org.role !== "member"
      ? await Promise.all([listApprovalQueue(), listOrgTemplates()])
      : [[], []];

  return (
    <TeamClient
      org={org}
      queue={queue}
      templates={overlays.map((o) => ({ id: o.id, name: o.name, baseSlug: o.baseSlug }))}
    />
  );
}
