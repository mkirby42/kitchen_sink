import { parseProfileRole, type ProfileRole } from "@/lib/role";
import { supabasePublicConfig } from "@/lib/supabase/env";

export type { ProfileRole };
export { parseProfileRole };

export type NavUser = {
  id: string;
  role: ProfileRole | null;
  hasTherapist?: boolean;
};

export async function loadNavUser(): Promise<NavUser | null> {
  if (!supabasePublicConfig()) return null;
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const [{ data: profile }, { data: therapist }] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
      supabase
        .from("therapists")
        .select("profile_id")
        .eq("profile_id", user.id)
        .maybeSingle(),
    ]);

    const role = parseProfileRole(profile?.role);

    return { id: user.id, role, hasTherapist: Boolean(therapist) };
  } catch {
    return null;
  }
}
