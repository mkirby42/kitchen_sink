import { createBrowserClient } from "@supabase/ssr";
import { supabasePublicConfig } from "./env";

export function createClient() {
  const config = supabasePublicConfig();
  if (!config) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  return createBrowserClient(config.url, config.key);
}
