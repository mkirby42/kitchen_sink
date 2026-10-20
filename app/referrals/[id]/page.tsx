import type { Metadata } from "next";
import { AccountShell } from "@/components/auth/AccountShell";
import { InterestedList } from "@/components/referrals/InterestedList";
import { ReferralGate } from "@/components/referrals/ReferralGate";
import { loadReferralAccess } from "@/lib/referrals/gate";
import { loadInterestRoster, loadOwnedReferral } from "@/lib/referrals/load";
import { isReferralId } from "@/lib/referrals/options";
import { canCloseEarly, referralNow, referralPhase } from "@/lib/referrals/time";
import { deploymentOrigin } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Who's interested",
};

export default async function InterestedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const access = await loadReferralAccess();
  if (access.kind !== "ready") return <ReferralGate access={access} />;

  const { id } = await params;
  if (!isReferralId(id)) {
    return (
      <AccountShell
        eyebrow="Referrals"
        title="That referral isn't available"
        lede="It may have been removed, or the link is out of date."
      />
    );
  }

  const owned = await loadOwnedReferral(id);
  if (owned.error === "The referral board isn't available yet.") {
    return (
      <AccountShell
        eyebrow="Referrals"
        title="Who's interested"
        lede="The referral board isn't available yet. Apply the referral migration, then reload."
      />
    );
  }
  if (!owned.post) {
    return (
      <AccountShell
        eyebrow="Referrals"
        title="That referral isn't available"
        lede="Only the therapist who posted it can see who's interested."
      />
    );
  }

  const roster = await loadInterestRoster(id);
  const phase = referralPhase(owned.post, referralNow());
  return (
    <InterestedList
      postId={owned.post.id}
      post={owned.post}
      therapists={roster.rows}
      origin={await deploymentOrigin()}
      canClose={canCloseEarly(phase)}
    />
  );
}
