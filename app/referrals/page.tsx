import type { Metadata } from "next";
import { AccountShell } from "@/components/auth/AccountShell";
import { ReferralBoard } from "@/components/referrals/ReferralBoard";
import { ReferralGate } from "@/components/referrals/ReferralGate";
import { loadReferralAccess } from "@/lib/referrals/gate";
import { loadReferralBoard, loadReferralViewer } from "@/lib/referrals/load";
import { readBoardFilter } from "@/lib/referrals/rows";
import { sweepReferralRefreshEmails } from "@/lib/referrals/refresh";
import { referralNow } from "@/lib/referrals/time";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Referral board",
  alternates: { canonical: "/referrals" },
};

export default async function ReferralBoardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await loadReferralAccess();
  if (access.kind !== "ready") return <ReferralGate access={access} />;

  await sweepReferralRefreshEmails();
  const [board, viewer, raw] = await Promise.all([
    loadReferralBoard(),
    loadReferralViewer(access.userId),
    searchParams,
  ]);

  if (board.error === "The referral board isn't available yet.") {
    return (
      <AccountShell
        eyebrow="Referrals"
        title="Referral board"
        lede="The referral board isn't available yet. Apply the referral migration, then reload."
      />
    );
  }

  return (
    <ReferralBoard
      posts={board.rows}
      viewer={viewer}
      filter={readBoardFilter(raw)}
      loadError={board.error}
      now={referralNow()}
    />
  );
}
