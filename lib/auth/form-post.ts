import { NextResponse } from "next/server";
import {
  AUTH_EMAIL_INVALID,
  AUTH_FAILED,
  AUTH_PASSWORD_SHORT,
  AUTH_SIGNOUT_FAILED,
  AUTH_UNAVAILABLE,
  joinAuthErrorCopy,
  sanitizeAuthEmail,
  sanitizeAuthError,
  withAuthQuery,
} from "@/lib/auth/auth-query";
import {
  PASSWORD_MIN_LENGTH,
  passwordResetRedirect,
  parseResetFrom,
  resetRequestMessage,
  safeAppPath,
} from "@/lib/auth/password-reset";
import { routes } from "@/lib/routes";
import { originFromRequest } from "@/lib/site";
import { createClient, type AuthCookieCapture } from "@/lib/supabase/server";

/**
 * Browser sign-up is `signUp({ email, password })` with no metadata, role, or
 * emailRedirectTo. The therapist profile is created later by the join wizard.
 * A review account is created later when that person submits a review.
 */

type AuthError = { message: string; code?: string } | null;

export type AuthFormClient = {
  auth: {
    signInWithPassword: (credentials: {
      email: string;
      password: string;
    }) => Promise<{ data: { session: unknown }; error: AuthError }>;
    signUp: (credentials: {
      email: string;
      password: string;
    }) => Promise<{ data: { session: unknown; user: unknown }; error: AuthError }>;
    resetPasswordForEmail: (
      email: string,
      options: { redirectTo: string },
    ) => Promise<{ error: AuthError }>;
    signOut: () => Promise<{ error: AuthError }>;
  };
};

type Scope = "join" | "admin" | "review";

function field(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

function parseScope(value: string): Scope {
  if (value === "admin" || value === "review") return value;
  return "join";
}

export function requestOrigin(request: Request): string {
  const url = new URL(request.url);
  return (
    originFromRequest(
      request.headers.get("x-forwarded-host") ??
        request.headers.get("host") ??
        url.host,
      request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", ""),
    ) ?? url.origin
  );
}

export function allowsAuthPost(request: Request, origin: string): boolean {
  const header = request.headers.get("origin");
  if (!header) return true;
  try {
    return new URL(header).origin === new URL(origin).origin;
  } catch {
    return false;
  }
}

export function redirectSeeOther(
  origin: string,
  path: string,
  capture: AuthCookieCapture,
): NextResponse {
  const response = NextResponse.redirect(new URL(path, origin), 303);
  response.headers.set("Cache-Control", "no-store");
  for (const cookie of capture.cookies) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }
  for (const [key, value] of Object.entries(capture.headers)) {
    if (key.toLowerCase() === "location") continue;
    if (value) response.headers.set(key, value);
  }
  return response;
}

function emptyCapture(): AuthCookieCapture {
  return { cookies: [], headers: {} };
}

function scopeDefaults(scope: Scope, kind: "signin" | "signup") {
  if (scope === "admin") {
    return { next: routes.adminMedia, back: routes.adminMedia };
  }
  if (scope === "review") {
    return { next: routes.find, back: routes.find };
  }
  return {
    next: routes.join,
    back: kind === "signin" ? routes.joinSignIn : routes.join,
  };
}

function landing(requested: string, fallback: string): string {
  return safeAppPath(requested) ?? fallback;
}

function failurePath(back: string, error: string, email: string): string {
  return withAuthQuery(back, {
    error,
    email: email || null,
    sent: null,
  });
}

async function begin(request: Request): Promise<
  | { denied: NextResponse }
  | {
      origin: string;
      form: FormData;
      client: AuthFormClient;
      capture: AuthCookieCapture;
    }
> {
  const origin = requestOrigin(request);
  if (!allowsAuthPost(request, origin)) {
    return { denied: new NextResponse("Forbidden", { status: 403 }) };
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return { denied: new NextResponse("Bad request", { status: 400 }) };
  }

  const capture = emptyCapture();
  try {
    const client = (await createClient(capture)) as AuthFormClient;
    return { origin, form, client, capture };
  } catch (error) {
    console.error(
      "auth form",
      error instanceof Error ? error.message : "client unavailable",
    );
    const scope = parseScope(field(form, "scope"));
    const kind = field(form, "kind") === "signup" ? "signup" : "signin";
    const back = landing(field(form, "back"), scopeDefaults(scope, kind).back);
    return {
      denied: redirectSeeOther(
        origin,
        failurePath(back, AUTH_UNAVAILABLE, sanitizeAuthEmail(field(form, "email"))),
        capture,
      ),
    };
  }
}

function credentials(form: FormData): {
  email: string;
  password: string;
  emailError: string | null;
  passwordError: string | null;
} {
  const email = sanitizeAuthEmail(field(form, "email"));
  const password = field(form, "password");
  return {
    email,
    password,
    emailError: email ? null : AUTH_EMAIL_INVALID,
    passwordError:
      password.length >= PASSWORD_MIN_LENGTH ? null : AUTH_PASSWORD_SHORT,
  };
}

export async function postSignIn(request: Request): Promise<NextResponse> {
  const started = await begin(request);
  if ("denied" in started) return started.denied;
  const { origin, form, client, capture } = started;
  const scope = parseScope(field(form, "scope"));
  const defaults = scopeDefaults(scope, "signin");
  const next = landing(field(form, "next"), defaults.next);
  const back = landing(field(form, "back"), defaults.back);
  const { email, password, emailError, passwordError } = credentials(form);
  if (emailError || passwordError) {
    return redirectSeeOther(
      origin,
      failurePath(back, emailError ?? passwordError ?? AUTH_FAILED, email),
      capture,
    );
  }

  try {
    const result = await client.auth.signInWithPassword({ email, password });
    if (result.error || !result.data.session) {
      const message = sanitizeAuthError(
        result.error?.message || AUTH_FAILED,
        password,
      );
      return redirectSeeOther(origin, failurePath(back, message, email), capture);
    }
    return redirectSeeOther(
      origin,
      withAuthQuery(next, { error: null, email: null, sent: null }),
      capture,
    );
  } catch (error) {
    console.error(
      "auth sign-in",
      error instanceof Error ? error.message : "failed",
    );
    return redirectSeeOther(origin, failurePath(back, AUTH_FAILED, email), capture);
  }
}

export async function postSignUp(request: Request): Promise<NextResponse> {
  const started = await begin(request);
  if ("denied" in started) return started.denied;
  const { origin, form, client, capture } = started;
  const scope = parseScope(field(form, "scope"));
  const defaults = scopeDefaults(scope, "signup");
  const next = landing(field(form, "next"), defaults.next);
  const back = landing(field(form, "back"), defaults.back);
  const { email, password, emailError, passwordError } = credentials(form);
  if (emailError || passwordError) {
    return redirectSeeOther(
      origin,
      failurePath(back, emailError ?? passwordError ?? AUTH_FAILED, email),
      capture,
    );
  }

  try {
    // Match the browser forms: no user metadata, role, or emailRedirectTo.
    const result = await client.auth.signUp({ email, password });
    if (result.error) {
      const raw =
        scope === "join"
          ? joinAuthErrorCopy(result.error.message)
          : result.error.message;
      return redirectSeeOther(
        origin,
        failurePath(back, sanitizeAuthError(raw, password), email),
        capture,
      );
    }
    if (result.data.session) {
      return redirectSeeOther(
        origin,
        withAuthQuery(next, { error: null, email: null, sent: null }),
        capture,
      );
    }
    if (result.data.user) {
      return redirectSeeOther(
        origin,
        withAuthQuery(back, { error: null, email, sent: "confirm" }),
        capture,
      );
    }
    return redirectSeeOther(origin, failurePath(back, AUTH_FAILED, email), capture);
  } catch (error) {
    console.error(
      "auth sign-up",
      error instanceof Error ? error.message : "failed",
    );
    return redirectSeeOther(origin, failurePath(back, AUTH_FAILED, email), capture);
  }
}

export async function postForgotPassword(request: Request): Promise<NextResponse> {
  const started = await begin(request);
  if ("denied" in started) return started.denied;
  const { origin, form, client, capture } = started;
  const from = parseResetFrom(field(form, "from"));
  const returnTo = safeAppPath(field(form, "return"));
  const email = sanitizeAuthEmail(field(form, "email"));

  const back = (error: string | null, sent: "1" | null) => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (returnTo) params.set("return", returnTo);
    if (sent) params.set("sent", sent);
    if (error) params.set("error", error);
    if (!sent && email) params.set("email", email);
    const query = params.toString();
    return query ? `${routes.forgotPassword}?${query}` : routes.forgotPassword;
  };

  if (!email) {
    return redirectSeeOther(origin, back(AUTH_EMAIL_INVALID, null), capture);
  }

  try {
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: passwordResetRedirect(origin),
    });
    const result = resetRequestMessage(error);
    if (result.ok) {
      return redirectSeeOther(origin, back(null, "1"), capture);
    }
    return redirectSeeOther(
      origin,
      back(sanitizeAuthError(result.message), null),
      capture,
    );
  } catch (error) {
    console.error(
      "auth reset",
      error instanceof Error ? error.message : "failed",
    );
    return redirectSeeOther(origin, back(AUTH_FAILED, null), capture);
  }
}

export async function postSignOut(request: Request): Promise<NextResponse> {
  const started = await begin(request);
  if ("denied" in started) return started.denied;
  const { origin, client, capture } = started;
  try {
    const { error } = await client.auth.signOut();
    if (error) {
      return redirectSeeOther(
        origin,
        failurePath(routes.joinSignIn, AUTH_SIGNOUT_FAILED, ""),
        capture,
      );
    }
    return redirectSeeOther(origin, routes.joinSignIn, capture);
  } catch (error) {
    console.error(
      "auth sign-out",
      error instanceof Error ? error.message : "failed",
    );
    return redirectSeeOther(
      origin,
      failurePath(routes.joinSignIn, AUTH_SIGNOUT_FAILED, ""),
      capture,
    );
  }
}
