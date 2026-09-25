import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh() {}, push() {}, replace() {} }),
}));

import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { JoinAuth } from "@/components/join/JoinAuth";
import { ReviewAuth } from "@/components/profile/ReviewAuth";
import {
  PASSWORD_MISMATCH_MESSAGE,
  PASSWORD_UPDATED_MESSAGE,
  RESET_LINK_INVALID_MESSAGE,
  RESET_RATE_LIMIT_MESSAGE,
  RESET_REDIRECT_MESSAGE,
  RESET_SEND_FAILED_MESSAGE,
  RESET_SENT_MESSAGE,
  forgotPasswordPath,
  passwordChangeError,
  passwordResetRedirect,
  passwordUpdateMessage,
  readResetLink,
  resetContinuePath,
  resetLinkAction,
  resetRequestMessage,
  resetSignInPath,
  safeAppPath,
} from "@/lib/auth/password-reset";

describe("password reset copy", () => {
  it("uses the same success copy when the email is missing", () => {
    expect(resetRequestMessage(null)).toEqual({
      ok: true,
      message: RESET_SENT_MESSAGE,
    });
    expect(
      resetRequestMessage({ code: "user_not_found", message: "User not found" }),
    ).toEqual({ ok: true, message: RESET_SENT_MESSAGE });
    expect(RESET_SENT_MESSAGE).not.toMatch(/not found|does not exist/i);
  });

  it("hides raw send failures and keeps rate-limit and redirect copy", () => {
    const leaked = resetRequestMessage({
      message: "lookup failed for hidden@example.com",
    });
    expect(leaked).toEqual({ ok: false, message: RESET_SEND_FAILED_MESSAGE });
    expect(leaked.message).not.toContain("hidden@example.com");

    expect(
      resetRequestMessage({
        code: "over_email_send_rate_limit",
        message: "For security purposes, you can only request this once every 60 seconds",
      }),
    ).toEqual({ ok: false, message: RESET_RATE_LIMIT_MESSAGE });

    expect(
      resetRequestMessage({ message: "redirect_to is not allowed" }),
    ).toEqual({ ok: false, message: RESET_REDIRECT_MESSAGE });
  });

  it("checks the new password locally and strips secrets from update errors", () => {
    expect(passwordChangeError("short", "short")).toMatch(/at least 6/i);
    expect(passwordChangeError("long-enough", "different")).toBe(PASSWORD_MISMATCH_MESSAGE);
    expect(passwordChangeError("long-enough", "long-enough")).toBeNull();
    expect(passwordUpdateMessage({ message: "New password should be different from the old password." })).toMatch(
      /different/,
    );
    expect(passwordUpdateMessage({ message: "bad token for a@b.co" })).toBe(
      "We couldn't update that password. Try again.",
    );
  });
});

describe("reset links", () => {
  it("builds a same-origin redirect and safe return paths", () => {
    expect(passwordResetRedirect("https://kitchen-sink-tau.vercel.app/")).toBe(
      "https://kitchen-sink-tau.vercel.app/reset-password",
    );
    expect(forgotPasswordPath("join")).toBe("/forgot-password?from=join");
    expect(forgotPasswordPath("admin")).toBe("/forgot-password?from=admin");
    expect(
      forgotPasswordPath("review", "/t/11111111-1111-4111-8111-111111111111"),
    ).toBe(
      "/forgot-password?from=review&return=%2Ft%2F11111111-1111-4111-8111-111111111111",
    );
    expect(forgotPasswordPath("review", "https://evil.test/phish")).toBe(
      "/forgot-password?from=review",
    );
    expect(safeAppPath("//evil.test")).toBeNull();
    expect(safeAppPath("/\\evil")).toBeNull();
    expect(resetSignInPath("join", null)).toBe("/join?mode=signin");
    expect(resetContinuePath("join", null)).toBe("/join");
    expect(resetSignInPath("admin", null)).toBe("/admin/media");
    expect(resetContinuePath("review", "/t/abc")).toBe("/t/abc");
  });

  it("reads pkce, token hash, and hash-session links", () => {
    const code = readResetLink("https://site.test/reset-password?code=abc");
    expect(code.cleanPath).toBe("/reset-password");
    expect(resetLinkAction(code.params)).toBe("code");

    const hash = readResetLink(
      "https://site.test/reset-password?token_hash=th&type=recovery",
    );
    expect(resetLinkAction(hash.params)).toBe("otp");
    expect(hash.cleanPath).toBe("/reset-password");

    const implicit = readResetLink(
      "https://site.test/reset-password#access_token=a&refresh_token=r&type=recovery",
    );
    expect(resetLinkAction(implicit.params)).toBe("session");

    const expired = readResetLink(
      "https://site.test/reset-password?error=access_denied&error_description=expired",
    );
    expect(resetLinkAction(expired.params)).toBe("invalid");
    expect(resetLinkAction({ tokenHash: "th", type: "signup" })).toBe("invalid");
    expect(resetLinkAction(null)).toBe("session-check");
  });
});

describe("password reset screens", () => {
  it("links therapist sign-in to forgot password and hides it on sign up", () => {
    const signIn = renderToStaticMarkup(
      createElement(JoinAuth, { initialMode: "signin" }),
    );
    expect(signIn).toContain('href="/forgot-password?from=join"');
    expect(signIn).toContain("Forgot password?");

    const signUp = renderToStaticMarkup(
      createElement(JoinAuth, { initialMode: "signup" }),
    );
    expect(signUp).not.toContain("Forgot password?");
  });

  it("links a client review sign-in back to that profile", () => {
    const html = renderToStaticMarkup(
      createElement(ReviewAuth, {
        returnTo: "/t/11111111-1111-4111-8111-111111111111",
      }),
    );
    expect(html).toContain("Forgot password?");
    expect(html).toContain(
      'href="/forgot-password?from=review&amp;return=%2Ft%2F11111111-1111-4111-8111-111111111111"',
    );
  });

  it("asks for an email without claiming the account exists", () => {
    const html = renderToStaticMarkup(
      createElement(ForgotPasswordForm, { from: "join" }),
    );
    expect(html).toContain("Forgot your password?");
    expect(html).toContain("Send reset link");
    expect(html).toContain('href="/join?mode=signin"');
    expect(html).not.toContain(RESET_SENT_MESSAGE);
  });

  it("starts the reset page by checking the link", () => {
    const html = renderToStaticMarkup(createElement(ResetPasswordForm));
    expect(html).toContain("Choose a new password");
    expect(html).toContain("Checking your reset link…");
    expect(html).not.toContain(PASSWORD_UPDATED_MESSAGE);
    expect(html).not.toContain(RESET_LINK_INVALID_MESSAGE);
  });
});
