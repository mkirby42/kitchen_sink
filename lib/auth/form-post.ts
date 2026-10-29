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
  PASSWORD_UPDATED_COOKIE,
  passwordChangeError,
  passwordResetRedirect,
  passwordUpdateMessage,
  parseResetFrom,
  resetCleanPath,
  resetContinuePath,
  resetExchangeProblem,
  resetFormErrorPath,
  resetProblemPath,
  resetRequestMessage,
  safeAppPath,
  type ResetFrom,
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

type ResetAuthClient = {
  auth: {
    getUser: () => Promise<{
      data: { user: { id: string } | null };
      error: AuthError;
    }>;
    updateUser: (input: { password: string }) => Promise<{ error: AuthError }>;
    exchangeCodeForSession: (
      code: string,
      options?: { flowId: string },
    ) => Promise<{ error: AuthError }>;
    verifyOtp: (input: {
      type: "recovery";
      token_hash: string;
    }) => Promise<{ error: AuthError }>;
  };
  from: (table: string) => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => {
        in: (
          column: string,
          values: string[],
        ) => {
          limit: (count: number) => Promise<{
            data: { id: string }[] | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };
};

async function openResetClient(request: Request): Promise<
  | { denied: NextResponse }
  | { origin: string; client: ResetAuthClient; capture: AuthCookieCapture }
> {
  const origin = requestOrigin(request);
  const capture = emptyCapture();
  try {
    const client = (await createClient(capture)) as unknown as ResetAuthClient;
    return { origin, client, capture };
  } catch (error) {
    console.error(
      "auth reset callback",
      error instanceof Error ? error.message : "client unavailable",
    );
    return {
      denied: redirectSeeOther(origin, resetProblemPath("invalid"), capture),
    };
  }
}

/** Same destination the browser form's Continue button uses, plus `from` when the link carried it. */
async function passwordUpdatedDestination(
  client: ResetAuthClient,
  userId: string,
  from: ResetFrom | null,
  returnTo: string | null,
): Promise<string> {
  if (returnTo) return returnTo;
  if (from) return resetContinuePath(from, null);
  try {
    const { data, error } = await client
      .from("profile_starts")
      .select("id")
      .eq("profile_id", userId)
      .in("status", ["drafting", "ready"])
      .limit(1);
    if (!error && data && data.length > 0) return routes.joinEdit;
  } catch {
    // Profile starts may not be migrated yet.
  }
  return routes.home;
}

export async function getResetCallback(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code")?.trim() ?? "";
  const tokenHash = url.searchParams.get("token_hash")?.trim() ?? "";
  const type = url.searchParams.get("type")?.trim() ?? "";
  const flowId = url.searchParams.get("sb_flow_id")?.trim() ?? "";
  const from = url.searchParams.get("from");
  const returnTo = url.searchParams.get("return");
  const started = await openResetClient(request);
  if ("denied" in started) return started.denied;
  const { origin, client, capture } = started;

  try {
    if (code) {
      const { error } = await client.auth.exchangeCodeForSession(
        code,
        flowId ? { flowId } : undefined,
      );
      if (error) {
        return redirectSeeOther(
          origin,
          resetProblemPath(resetExchangeProblem(error, code), from, returnTo),
          capture,
        );
      }
      return redirectSeeOther(origin, resetCleanPath(from, returnTo), capture);
    }

    if (tokenHash && type === "recovery") {
      const { error } = await client.auth.verifyOtp({
        type: "recovery",
        token_hash: tokenHash,
      });
      if (error) {
        return redirectSeeOther(
          origin,
          resetProblemPath("invalid", from, returnTo),
          capture,
        );
      }
      return redirectSeeOther(origin, resetCleanPath(from, returnTo), capture);
    }

    return redirectSeeOther(
      origin,
      resetProblemPath("invalid", from, returnTo),
      capture,
    );
  } catch (error) {
    console.error(
      "auth reset callback",
      error instanceof Error ? error.message : "failed",
    );
    const problem =
      error instanceof Error ? resetExchangeProblem({ message: error.message }, code) : "invalid";
    return redirectSeeOther(
      origin,
      resetProblemPath(code ? problem : "invalid", from, returnTo),
      capture,
    );
  }
}

export async function postUpdatePassword(request: Request): Promise<NextResponse> {
  const started = await begin(request);
  if ("denied" in started) return started.denied;
  const { origin, form, client, capture } = started;
  const auth = client as unknown as ResetAuthClient;
  const from = parseResetFrom(field(form, "from"));
  const returnTo = safeAppPath(field(form, "return"));
  const fail = (error: string) =>
    redirectSeeOther(origin, resetFormErrorPath(error, from, returnTo), capture);

  try {
    const { data, error } = await auth.auth.getUser();
    if (error || !data.user) {
      return redirectSeeOther(
        origin,
        resetProblemPath("invalid", from, returnTo),
        capture,
      );
    }

    const password = field(form, "password");
    const confirm = field(form, "confirm");
    const local = passwordChangeError(password, confirm);
    if (local) return fail(local);

    const result = await auth.auth.updateUser({ password });
    if (result.error) {
      return fail(sanitizeAuthError(passwordUpdateMessage(result.error), password));
    }

    const next = await passwordUpdatedDestination(auth, data.user.id, from, returnTo);
    const response = redirectSeeOther(
      origin,
      withAuthQuery(next, { updated: "1", error: null, email: null, sent: null }),
      capture,
    );
    response.cookies.set(PASSWORD_UPDATED_COOKIE, "1", {
      path: "/",
      maxAge: 120,
      sameSite: "lax",
      httpOnly: true,
    });
    return response;
  } catch (error) {
    console.error(
      "auth update password",
      error instanceof Error ? error.message : "failed",
    );
    return fail("We couldn't update that password. Try again.");
  }
}
