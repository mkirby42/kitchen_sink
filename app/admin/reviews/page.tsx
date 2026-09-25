import type { Metadata } from "next";
import { AdminAuth } from "@/components/admin/AdminAuth";
import { ReviewQueue } from "@/components/admin/ReviewQueue";
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
      <main className="mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="font-display text-4xl">Review queue</h1>
        <p className="mt-4 text-mute">Auth isn&apos;t configured yet.</p>
      </main>
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

  if (profile?.role !== "admin") {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <p className="text-xs font-semibold tracking-[0.2em] text-clay uppercase">
          Ops
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight">
          Admin access only
        </h1>
        <p className="mt-4 text-mute">
          This queue is for Kitchen Sink ops. A therapist or patient login
          cannot approve or reject reviews.
        </p>
      </main>
    );
  }

  let reviews;
  try {
    reviews = await listPendingReviews(supabase);
  } catch {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <h1 className="font-display text-4xl">Review queue</h1>
        <p className="mt-4 text-mute">The review queue isn&apos;t available right now.</p>
      </main>
    );
  }

  return <ReviewQueue reviews={reviews} />;
}
