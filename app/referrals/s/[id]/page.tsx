import type { Metadata } from "next";
import { AccountShell } from "@/components/auth/AccountShell";
import { ShareList } from "@/components/referrals/ShareList";
import { loadShareProfiles } from "@/lib/referrals/load";
import { isReferralId } from "@/lib/referrals/options";
import { createClient } from "@/lib/supabase/server";
import { supabasePublicConfig } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Therapists for you",
  robots: { index: false, follow: false },
};

export default async function ReferralSharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isReferralId(id) || !supabasePublicConfig()) {
    return (
      <AccountShell
        eyebrow="Referrals"
        title="That list isn't available"
        lede="The link may be out of date."
      />
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("referral_share", { p_id: id });
  const ids = Array.isArray(data) ? data.filter((value) => typeof value === "string" && isReferralId(value)) : [];
  if (error || ids.length === 0) {
    return (
      <AccountShell
        eyebrow="Referrals"
        title="That list isn't available"
        lede="The link may be out of date."
      />
    );
  }

  const therapists = await loadShareProfiles(ids);
  return <ShareList therapists={therapists} />;
}
