import { readAudienceCookie } from "@/lib/audience-cookie";
import { parseProfileRole, type ProfileRole } from "@/lib/role";
import { supabasePublicConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type ReferralAccess =
  | { kind: "unconfigured" }
  | { kind: "signed-out" }
  | { kind: "client-preview" }
  | {
      kind: "needs-publish";
      role: ProfileRole | null;
      hasTherapist: boolean;
    }
  | { kind: "ready"; userId: string; role: ProfileRole | null };

export async function loadReferralAccess(): Promise<ReferralAccess> {
  if (!supabasePublicConfig()) return { kind: "unconfigured" };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { kind: "signed-out" };

  const [{ data: profile }, { data: therapist }, audience] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    supabase
      .from("therapists")
      .select("published")
      .eq("profile_id", user.id)
      .maybeSingle(),
    readAudienceCookie(),
  ]);

  const role = parseProfileRole(profile?.role);
  if (role === "admin" && audience === "client") return { kind: "client-preview" };
  if (therapist?.published !== true) {
    return { kind: "needs-publish", role, hasTherapist: Boolean(therapist) };
  }
  return { kind: "ready", userId: user.id, role };
}
