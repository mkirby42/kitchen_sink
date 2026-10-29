import { routes } from "@/lib/routes";

export const PASSWORD_MIN_LENGTH = 6;

export const RESET_SENT_MESSAGE =
  "If an account exists for that email, we sent a link to choose a new password. Check your inbox.";

export const RESET_LINK_INVALID_MESSAGE =
  "This reset link is invalid or has expired. Request a new one.";

export const RESET_LINK_BROWSER_MESSAGE =
  "Open the reset link in the same browser you used to request it, or request a new one.";

export const RESET_RATE_LIMIT_MESSAGE =
  "Too many reset emails. Wait a few minutes and try again.";

export const RESET_SEND_FAILED_MESSAGE =
  "We couldn't send a reset email. Try again.";

export const RESET_REDIRECT_MESSAGE =
  "We couldn't send a reset email from this address. Open the Kitchen Sink site you usually use and try again.";

export const PASSWORD_MISMATCH_MESSAGE = "Those passwords don't match.";

export const PASSWORD_UPDATED_MESSAGE =
  "Your password is updated. You're signed in with it.";

/** One-request flash so the continue page can show PASSWORD_UPDATED_MESSAGE. */
export const PASSWORD_UPDATED_COOKIE = "ks-password-updated";

export const RESET_RETURN_STORAGE_KEY = "kitchen-sink-reset-return";

export type ResetFrom = "join" | "admin" | "review";

export type AuthErrorLike = {
  message?: string;
  code?: string;
};

export type ResetLinkParams = {
  code?: string;
  tokenHash?: string;
  type?: string;
  error?: string;
  accessToken?: string;
  refreshToken?: string;
};

export function parseResetFrom(value: string | null | undefined): ResetFrom | null {
  if (value === "join" || value === "admin" || value === "review") return value;
  return null;
}

/** Same-origin path only. Drops protocol-relative and off-site targets. */
export function safeAppPath(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 300) return null;
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  if (/[\s\\]/.test(trimmed) || trimmed.includes("://")) return null;

  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    return null;
  }
  if (!decoded.startsWith("/") || decoded.startsWith("//")) return null;
  if (/[\s\\]/.test(decoded) || decoded.includes("://")) return null;
  return trimmed;
}

/** Where to land after the new password is saved and the session exists. */
export function resetContinuePath(
  from: string | null | undefined,
  returnTo: string | null | undefined,
): string {
  const safe = safeAppPath(returnTo);
  if (safe) return safe;
  switch (parseResetFrom(from)) {
    case "admin":
      return routes.adminMedia;
    case "review":
      return routes.find;
    case "join":
      return routes.join;
    default:
      return routes.home;
  }
}

/** Sign-in screen to return to before the password has changed. */
export function resetSignInPath(
  from: string | null | undefined,
  returnTo: string | null | undefined,
): string {
  const safe = safeAppPath(returnTo);
  if (safe) return safe;
  switch (parseResetFrom(from)) {
    case "admin":
      return routes.adminMedia;
    case "review":
      return routes.find;
    default:
      return routes.joinSignIn;
  }
}

export function forgotPasswordPath(from: ResetFrom, returnTo?: string): string {
  const query = new URLSearchParams();
  query.set("from", from);
  const safe = returnTo ? safeAppPath(returnTo) : null;
  if (safe) query.set("return", safe);
  return `${routes.forgotPassword}?${query}`;
}

/** Exact URL Supabase redirects to after the recovery email. Allow-list this path. */
export function passwordResetRedirect(origin: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}${routes.resetPassword}`;
}

export function resetRequestMessage(error: AuthErrorLike | null): {
  ok: boolean;
  message: string;
} {
  if (!error) return { ok: true, message: RESET_SENT_MESSAGE };

  const code = (error.code ?? "").toLowerCase();
  const message = error.message ?? "";
  const leaked =
    code === "user_not_found" ||
    /user not found|email not found|no user found|not registered|does not exist/i.test(
      message,
    );

  if (leaked) return { ok: true, message: RESET_SENT_MESSAGE };

  if (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit" ||
    /rate limit|only request this once|too many requests/i.test(message)
  ) {
    return { ok: false, message: RESET_RATE_LIMIT_MESSAGE };
  }

  if (/redirect/i.test(message)) {
    return { ok: false, message: RESET_REDIRECT_MESSAGE };
  }

  return { ok: false, message: RESET_SEND_FAILED_MESSAGE };
}

export function passwordChangeError(password: string, confirm: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (password !== confirm) return PASSWORD_MISMATCH_MESSAGE;
  return null;
}

export function passwordUpdateMessage(error: AuthErrorLike): string {
  const message = error.message?.trim() ?? "";
  if (!message || message.length > 200 || /token|bearer|jwt|@/i.test(message)) {
    return "We couldn't update that password. Try again.";
  }
  return message;
}

export type ResetLinkAction = "otp" | "code" | "session" | "invalid" | "session-check";

/** Which Supabase call the reset page should make for this link. */
export function resetLinkAction(params: ResetLinkParams | null): ResetLinkAction {
  if (!params) return "session-check";
  if (params.error) return "invalid";
  if (params.tokenHash) return params.type === "recovery" ? "otp" : "invalid";
  if (params.code) return "code";
  if (params.accessToken && params.refreshToken && params.type === "recovery") {
    return "session";
  }
  return "invalid";
}

export function readResetLink(href: string): {
  params: ResetLinkParams | null;
  cleanPath: string;
} {
  const url = new URL(href);
  const hash = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : "");
  const params: ResetLinkParams = {
    code: url.searchParams.get("code") ?? undefined,
    tokenHash: url.searchParams.get("token_hash") ?? undefined,
    type: url.searchParams.get("type") ?? hash.get("type") ?? undefined,
    error:
      url.searchParams.get("error") ??
      hash.get("error") ??
      url.searchParams.get("error_description") ??
      hash.get("error_description") ??
      undefined,
    accessToken: hash.get("access_token") ?? undefined,
    refreshToken: hash.get("refresh_token") ?? undefined,
  };
  const has =
    params.code ||
    params.tokenHash ||
    params.error ||
    params.accessToken ||
    params.refreshToken;

  return {
    params: has ? params : null,
    cleanPath: `${url.pathname}${url.search && !has ? url.search : ""}`,
  };
}

export function rememberResetReturn(path: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(RESET_RETURN_STORAGE_KEY, path);
  } catch {
    // Private mode can block storage. Continue still has a fallback.
  }
}

export function readResetReturn(fallback: string): string {
  if (typeof window === "undefined") return fallback;
  try {
    return safeAppPath(sessionStorage.getItem(RESET_RETURN_STORAGE_KEY)) ?? fallback;
  } catch {
    return fallback;
  }
}

export type ResetSearch = Record<string, string | string[] | undefined>;

function firstSearch(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

/** Supabase PKCE auth codes are UUIDs. A garbage `code` is not a different browser. */
const PKCE_CODE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SUPABASE_LINK_ERRORS = new Set([
  "access_denied",
  "server_error",
  "unauthorized_client",
  "temporarily_unavailable",
]);

export type ResetVisit =
  | {
      kind: "exchange";
      code: string;
      tokenHash: string;
      type: string;
      flowId: string;
      from: ResetFrom | null;
      returnTo: string | null;
    }
  | { kind: "problem"; problem: "invalid" | "browser" }
  | {
      kind: "page";
      error: string;
      from: ResetFrom | null;
      returnTo: string | null;
    };

/** Server-side view of /reset-password before any session lookup. */
export function classifyResetVisit(params: ResetSearch): ResetVisit {
  const code = firstSearch(params.code).trim();
  const tokenHash = firstSearch(params.token_hash).trim();
  const type = firstSearch(params.type).trim();
  const error = firstSearch(params.error).trim();
  const errorCode = firstSearch(params.error_code).trim();
  const errorDescription = firstSearch(params.error_description).trim();
  const link = firstSearch(params.link).trim();
  const flowId = firstSearch(params.sb_flow_id).trim();
  const from = parseResetFrom(firstSearch(params.from));
  const returnTo = safeAppPath(firstSearch(params.return));

  if (link === "browser") return { kind: "problem", problem: "browser" };
  if (link === "invalid") return { kind: "problem", problem: "invalid" };
  if (
    errorCode ||
    errorDescription ||
    SUPABASE_LINK_ERRORS.has(error) ||
    error === RESET_LINK_INVALID_MESSAGE
  ) {
    return { kind: "problem", problem: "invalid" };
  }
  if (error === RESET_LINK_BROWSER_MESSAGE) {
    return { kind: "problem", problem: "browser" };
  }
  if (code || (tokenHash && type === "recovery")) {
    return { kind: "exchange", code, tokenHash, type, flowId, from, returnTo };
  }
  if (tokenHash) return { kind: "problem", problem: "invalid" };

  return { kind: "page", error, from, returnTo };
}

/**
 * Missing verifier on a real-looking code means the link was opened in another
 * browser. Any other exchange failure, including a bogus code, is invalid.
 */
export function resetExchangeProblem(
  error: AuthErrorLike | null,
  code: string,
): "browser" | "invalid" {
  const blob = `${error?.code ?? ""} ${error?.message ?? ""}`;
  const verifierMissing = /code verifier|pkce/i.test(blob);
  if (verifierMissing && PKCE_CODE.test(code)) return "browser";
  return "invalid";
}

export function resetCallbackPath(
  visit: Extract<ResetVisit, { kind: "exchange" }>,
): string {
  const params = new URLSearchParams();
  if (visit.code) params.set("code", visit.code);
  if (visit.tokenHash) params.set("token_hash", visit.tokenHash);
  if (visit.type) params.set("type", visit.type);
  if (visit.flowId) params.set("sb_flow_id", visit.flowId);
  if (visit.from) params.set("from", visit.from);
  if (visit.returnTo) params.set("return", visit.returnTo);
  return `/auth/reset-callback?${params}`;
}

export function resetCleanPath(
  from?: string | null,
  returnTo?: string | null,
): string {
  const params = new URLSearchParams();
  const parsed = parseResetFrom(from);
  if (parsed) params.set("from", parsed);
  const ret = safeAppPath(returnTo);
  if (ret) params.set("return", ret);
  const query = params.toString();
  return query ? `${routes.resetPassword}?${query}` : routes.resetPassword;
}

export function resetProblemPath(
  problem: "invalid" | "browser",
  from?: string | null,
  returnTo?: string | null,
): string {
  const params = new URLSearchParams();
  const parsed = parseResetFrom(from);
  if (parsed) params.set("from", parsed);
  const ret = safeAppPath(returnTo);
  if (ret) params.set("return", ret);
  params.set("link", problem === "browser" ? "browser" : "invalid");
  return `${routes.resetPassword}?${params}`;
}

export function resetFormErrorPath(
  error: string,
  from?: string | null,
  returnTo?: string | null,
): string {
  const params = new URLSearchParams();
  const parsed = parseResetFrom(from);
  if (parsed) params.set("from", parsed);
  const ret = safeAppPath(returnTo);
  if (ret) params.set("return", ret);
  params.set("error", error);
  return `${routes.resetPassword}?${params}`;
}
