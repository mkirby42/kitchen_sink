import type { SupabaseClient } from "@supabase/supabase-js";

export type ReviewRole = "patient" | "therapist";

export type ReviewViewer = {
  userId: string | null;
  role: ReviewRole | null;
  isOwner: boolean;
};

export async function loadReviewViewer(
  supabase: SupabaseClient,
  therapistId: string,
): Promise<ReviewViewer> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { userId: null, role: null, isOwner: false };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role =
    profile?.role === "patient" || profile?.role === "therapist"
      ? profile.role
      : null;

  return {
    userId: user.id,
    role,
    isOwner: user.id === therapistId,
  };
}
