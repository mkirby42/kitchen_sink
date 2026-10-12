import { createClient } from "@supabase/supabase-js";

/** Server-only. Used to create the therapist login for a started draft. */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const SERVICE_ROLE_MISSING =
  "The site can't create that therapist login yet. Add SUPABASE_SERVICE_ROLE_KEY on the server (never in the browser), then try again. The request itself is already saved.";
