import type { SupabaseClient } from "@supabase/supabase-js";

export type InterestRole = "patient" | "therapist";

export type InterestViewer = {
  userId: string | null;
  role: InterestRole | null;
  interested: boolean;
  isOwner: boolean;
};

export async function loadInterestViewer(
  supabase: SupabaseClient,
  therapistId: string,
): Promise<InterestViewer> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { userId: null, role: null, interested: false, isOwner: false };
  }

  const isOwner = user.id === therapistId;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role =
    profile?.role === "patient" || profile?.role === "therapist"
      ? profile.role
      : null;

  if (role !== "patient") {
    return { userId: user.id, role, interested: false, isOwner };
  }

  const { data: row } = await supabase
    .from("interest")
    .select("id")
    .eq("patient_id", user.id)
    .eq("therapist_id", therapistId)
    .maybeSingle();

  return {
    userId: user.id,
    role,
    interested: Boolean(row),
    isOwner,
  };
}

export type InterestInboxRow = {
  id: string;
  alias: string;
  created_at: string;
};

export async function loadInterestInbox(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("list_my_interest");
  if (error) throw error;
  return (data ?? []) as InterestInboxRow[];
}

export async function ensurePatientProfile(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("ensure_patient_profile");
  if (error) throw error;
  return data as string;
}

export async function setInterest(
  supabase: SupabaseClient,
  therapistId: string,
  wanted: boolean,
) {
  const patientId = await ensurePatientProfile(supabase);

  if (wanted) {
    const { error } = await supabase.from("interest").insert({
      patient_id: patientId,
      therapist_id: therapistId,
    });
    if (error && error.code !== "23505") throw error;
    return;
  }

  const { error } = await supabase
    .from("interest")
    .delete()
    .eq("patient_id", patientId)
    .eq("therapist_id", therapistId);
  if (error) throw error;
}
