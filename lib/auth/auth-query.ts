import { PASSWORD_MIN_LENGTH } from "@/lib/auth/password-reset";

const ALREADY_HAS_ACCOUNT = /already|registered|exists/i;
const SIGN_IN_HINT = "Switch to Sign in if you already have an account.";

export const AUTH_UNAVAILABLE = "Auth isn't configured yet.";
export const AUTH_FAILED = "Unable to authenticate.";
export const AUTH_EMAIL_INVALID = "Enter a valid email.";
export const AUTH_PASSWORD_SHORT = `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
export const AUTH_SIGNOUT_FAILED = "We couldn't sign you out. Try again.";

/** Browser sign-up shows this when Auth creates a user and no session. */
export const SIGNUP_CONFIRM_MESSAGE =
  "Check your email to confirm, then sign in.";

/** Keep Supabase's already-registered copy and point the person at Sign in. */
export function joinAuthErrorCopy(message: string): string {
  const text = message.trim() || AUTH_FAILED;
  if (!ALREADY_HAS_ACCOUNT.test(text) || /switch to sign in/i.test(text)) return text;
  const spaced = /[.!?]$/.test(text) ? text : `${text}.`;
  return `${spaced} ${SIGN_IN_HINT}`;
}

export const authPost = {
  signIn: "/auth/sign-in",
  signUp: "/auth/sign-up",
  forgotPassword: "/auth/forgot-password",
  signOut: "/auth/sign-out",
  updatePassword: "/auth/update-password",
} as const;

export type AuthSearch = Record<string, string | string[] | undefined>;

export type AuthFlash = {
  error: string;
  email: string;
  sent: "" | "1" | "confirm";
};

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

/** Drop control characters, markup, and anything that looks like a token. */
export function sanitizeAuthError(message: string, secret?: string): string {
  let text = message.replace(/[\u0000-\u001f]+/g, " ").trim();
  if (secret) text = text.split(secret).join("").trim();
  text = text.replace(/[<>]/g, "");
  if (!text || text.length > 240) return AUTH_FAILED;
  if (/bearer\s+|eyJ[A-Za-z0-9_-]{8,}/i.test(text)) return AUTH_FAILED;
  return text;
}

export function sanitizeAuthEmail(value: string): string {
  const email = value.trim();
  if (!email || email.length > 320) return "";
  if (/[\s<>"'`]/.test(email)) return "";
  if (!/^[^@\s]+@[^@\s]+$/.test(email)) return "";
  return email;
}

/** Keep the page's own query (for example analytics `days`) and drop auth flash keys. */
export function pageReturnPath(path: string, params: AuthSearch): string {
  const url = new URL(path, "https://kitchen-sink.local");
  for (const [key, value] of Object.entries(params)) {
    if (key === "error" || key === "email" || key === "sent" || key === "password") {
      continue;
    }
    const first = Array.isArray(value) ? value[0] : value;
    if (first) url.searchParams.set(key, first);
  }
  const query = url.searchParams.toString();
  return query ? `${url.pathname}?${query}` : url.pathname;
}

export function readAuthQuery(params: AuthSearch): AuthFlash {
  const sentRaw = firstParam(params.sent);
  const sent = sentRaw === "1" || sentRaw === "confirm" ? sentRaw : "";
  const rawError = firstParam(params.error);
  return {
    error: rawError.trim() ? sanitizeAuthError(rawError) : "",
    email: sanitizeAuthEmail(firstParam(params.email)),
    sent,
  };
}

/** Same-origin path plus query. Never keeps a password field. */
export function withAuthQuery(
  path: string,
  updates: Record<string, string | null>,
): string {
  const url = new URL(path, "https://kitchen-sink.local");
  url.searchParams.delete("password");
  for (const [key, value] of Object.entries(updates)) {
    if (key === "password") continue;
    if (value == null || value === "") url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  }
  const query = url.searchParams.toString();
  return query ? `${url.pathname}?${query}` : url.pathname;
}
