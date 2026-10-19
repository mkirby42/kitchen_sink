import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountShell } from "@/components/auth/AccountShell";
import { MyReferrals } from "@/components/referrals/MyReferrals";
import { ReferralGate } from "@/components/referrals/ReferralGate";
import { loadReferralAccess } from "@/lib/referrals/gate";
import { loadMyReferrals } from "@/lib/referrals/load";
import { isReferralId } from "@/lib/referrals/options";
import { referralError } from "@/lib/referrals/rows";
import { sweepReferralRefreshEmails } from "@/lib/referrals/refresh";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My referrals",
  alternates: { canonical: "/referrals/mine" },
};

export default async function MyReferralsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await loadReferralAccess();
  if (access.kind !== "ready") return <ReferralGate access={access} />;

  const raw = await searchParams;
  const refresh = first(raw.refresh);
  let refreshError: string | null = null;
  if (refresh && isReferralId(refresh)) {
    const supabase = await createClient();
    const { error } = await supabase.rpc("refresh_referral_post", { p_token: refresh });
    if (error) refreshError = referralError(error);
    else redirect(`${routes.referralMine}?refreshed=1`);
  }

  await sweepReferralRefreshEmails();
  const mine = await loadMyReferrals();
  if (mine.error === "The referral board isn't available yet.") {
    return (
      <AccountShell
        eyebrow="Referrals"
        title="My referrals"
        lede="The referral board isn't available yet. Apply the referral migration, then reload."
      />
    );
  }

  const sent = first(raw.sent) === "1";
  const refreshed = first(raw.refreshed) === "1";
  const notice = refreshError
    ? refreshError
    : sent
      ? "Posted. It stays off the board until Kitchen Sink approves it."
      : refreshed
        ? "Refreshed. It's on the board for another 7 days."
        : null;

  return <MyReferrals posts={mine.rows} notice={notice} loadError={mine.error} />;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
