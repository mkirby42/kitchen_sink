import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabasePublicConfig } from "./env";

export const PASSWORD_UPDATED_HEADER = "x-ks-password-updated";

/**
 * A password update redirects to the continue path with `?updated=1`.
 * The root layout reads this header and renders the success line.
 * Every other request keeps the previous `NextResponse.next({ request })`.
 */
function nextWithRequest(request: NextRequest) {
  if (request.nextUrl.searchParams.get("updated") !== "1") {
    return NextResponse.next({ request });
  }
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(PASSWORD_UPDATED_HEADER, "1");
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export async function updateSession(request: NextRequest) {
  const config = supabasePublicConfig();
  if (!config) {
    return nextWithRequest(request);
  }

  let supabaseResponse = nextWithRequest(request);

  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = nextWithRequest(request);
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  await supabase.auth.getClaims();

  return supabaseResponse;
}
