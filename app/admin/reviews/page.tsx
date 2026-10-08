import type { Metadata } from "next";
import { AccountShell } from "@/components/auth/AccountShell";
import { AdminAuth } from "@/components/admin/AdminAuth";
import { AdminViewHold } from "@/components/admin/AdminViewHold";
import { ReviewQueue } from "@/components/admin/ReviewQueue";
import { adminToolsVisible } from "@/lib/audience";
import { readAudienceCookie } from "@/lib/audience-cookie";
import { listPendingReviews } from "@/lib/admin/reviews";
import { supabasePublicConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Review queue",
  robots: { index: false, follow: false },
  alternates: { canonical: "/admin/reviews" },
};

export default async function AdminReviewsPage() {
  if (!supabasePublicConfig()) {
    return (
      <AccountShell
        eyebrow="Ops"
        title="Review queue"
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
        title="Sign in to review"
        lede="This page is for Kitchen Sink ops. Pending client reviews stay unpublished until you approve them. Rejecting a review deletes it."
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
        lede="This queue is for Kitchen Sink ops. A therapist or patient login cannot approve or reject reviews."
      />
    );
  }

  let reviews;
  try {
    reviews = await listPendingReviews(supabase);
  } catch {
    return (
      <AccountShell
        eyebrow="Ops"
        title="Review queue"
        lede="The review queue isn't available right now."
      />
    );
  }

  return <ReviewQueue reviews={reviews} />;
}
