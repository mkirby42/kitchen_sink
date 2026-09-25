import type { SupabaseClient } from "@supabase/supabase-js";
import { parseProfileRole, type ProfileRole } from "@/lib/role";

export type ReviewRole = ProfileRole;

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

  const role = parseProfileRole(profile?.role);

  return {
    userId: user.id,
    role,
    isOwner: user.id === therapistId,
  };
}
