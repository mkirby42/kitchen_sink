import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabasePublicConfig } from "./env";

export type AuthCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

/** Cookies and cache headers a route handler must copy onto its own response. */
export type AuthCookieCapture = {
  cookies: AuthCookie[];
  headers: Record<string, string>;
};

export async function createClient(capture?: AuthCookieCapture) {
  const config = supabasePublicConfig();
  if (!config) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, headers) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components cannot write cookies. Route handlers copy
          // `capture` onto the NextResponse they return, including a redirect.
        }
        if (capture) {
          capture.cookies.push(...cookiesToSet);
          if (headers) Object.assign(capture.headers, headers);
        }
      },
    },
  });
}
