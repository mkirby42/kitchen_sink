import type { SupabaseClient } from "@supabase/supabase-js";

export async function ensurePatientProfile(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("ensure_patient_profile");
  if (error) throw error;
  return data as string;
}
