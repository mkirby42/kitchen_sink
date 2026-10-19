import type { Metadata } from "next";
import { AccountShell } from "@/components/auth/AccountShell";
import { AdminAuth } from "@/components/admin/AdminAuth";
import { AdminViewHold } from "@/components/admin/AdminViewHold";
import { ReferralQueue } from "@/components/admin/ReferralQueue";
import { adminToolsVisible } from "@/lib/audience";
import { readAudienceCookie } from "@/lib/audience-cookie";
import { loadAdminReferralQueue } from "@/lib/referrals/load";
import { supabasePublicConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Referral queue",
  robots: { index: false, follow: false },
  alternates: { canonical: "/admin/referrals" },
};

export default async function AdminReferralsPage() {
  if (!supabasePublicConfig()) {
    return (
      <AccountShell
        eyebrow="Ops"
        title="Referral queue"
        lede="Auth isn't configured yet."
      />
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <AdminAuth
        title="Sign in to review referrals"
        lede="This page is for Kitchen Sink ops. A referral stays off the board until you approve it."
      />
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !adminToolsVisible({
      role: profile?.role,
      audience: await readAudienceCookie(),
    })
  ) {
    if (profile?.role === "admin") return <AdminViewHold />;
    return (
      <AccountShell
        eyebrow="Ops"
        title="Admin access only"
        lede="This queue is for Kitchen Sink ops. A therapist login uses the referral board instead."
      />
    );
  }

  const queue = await loadAdminReferralQueue();
  if (queue.error === "The referral board isn't available yet.") {
    return (
      <AccountShell
        eyebrow="Ops"
        title="Referral queue"
        lede="The referral queue isn't available yet. Apply the referral migration, then reload."
      />
    );
  }
  if (queue.error) {
    return (
      <AccountShell
        eyebrow="Ops"
        title="Referral queue"
        lede={queue.error}
      />
    );
  }

  return <ReferralQueue posts={queue.rows} />;
}
