import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabasePublicConfig } from "@/lib/supabase/env";

export const MAYA_ID = "11111111-1111-4111-8111-111111111111";
export const MAYA_EMAIL = "maya@kitchensink.demo";
export const MAYA_PASSWORD = "seed-only";

export function dbConfigured() {
  return supabasePublicConfig() !== null;
}

function anonClient(): SupabaseClient {
  const config = supabasePublicConfig();
  if (!config) throw new Error("Supabase public env is not set");
  return createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createAnonClient() {
  return anonClient();
}

export async function createMayaClient() {
  const supabase = anonClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: MAYA_EMAIL,
    password: MAYA_PASSWORD,
  });
  if (error) throw error;
  return supabase;
}

export type SearchRow = {
  profile_id: string;
  name: string;
  photo_key: string | null;
  credential: string | null;
  start_date_of_practice: string | null;
  min_price_cents: number | null;
  min_duration_minutes: number | null;
  virtual_practice: boolean;
  in_person_practice: boolean;
  specialty_labels: string[];
  insurance_labels: string[];
  match_count: number;
  matched_labels: string[];
};

export async function search(
  supabase: SupabaseClient,
  args: {
    p_tags?: string[];
    p_virtual?: boolean;
    p_in_person?: boolean;
    p_state?: string | null;
    p_limit?: number;
    p_offset?: number;
  } = {},
) {
  const { data, error } = await supabase.rpc("search_therapists", {
    p_tags: args.p_tags ?? [],
    p_virtual: args.p_virtual ?? false,
    p_in_person: args.p_in_person ?? false,
    p_state: args.p_state ?? null,
    p_limit: args.p_limit ?? 24,
    p_offset: args.p_offset ?? 0,
  });
  if (error) throw error;
  return (data ?? []) as SearchRow[];
}
