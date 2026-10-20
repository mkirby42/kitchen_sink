import type { Metadata } from "next";
import { ReferralForm } from "@/components/referrals/ReferralForm";
import { ReferralGate } from "@/components/referrals/ReferralGate";
import { loadReferralAccess } from "@/lib/referrals/gate";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Post a referral",
  alternates: { canonical: "/referrals/new" },
};

export default async function NewReferralPage() {
  const access = await loadReferralAccess();
  if (access.kind !== "ready") return <ReferralGate access={access} />;
  return <ReferralForm />;
}
