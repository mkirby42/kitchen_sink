import { type NextRequest } from "next/server";
import { PASSWORD_UPDATED_COOKIE } from "@/lib/auth/password-reset";
import { updateSession } from "@/lib/supabase/update-session";

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);
  if (request.cookies.get(PASSWORD_UPDATED_COOKIE)?.value === "1") {
    response.cookies.set(PASSWORD_UPDATED_COOKIE, "", { path: "/", maxAge: 0 });
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots\\.txt|sitemap\\.xml|llms\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
