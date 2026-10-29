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
  PASSWORD_MIN_LENGTH,
  PASSWORD_UPDATED_MESSAGE,
  RESET_LINK_BROWSER_MESSAGE,
  RESET_LINK_INVALID_MESSAGE,
  RESET_RATE_LIMIT_MESSAGE,
  RESET_REDIRECT_MESSAGE,
  RESET_SEND_FAILED_MESSAGE,
  RESET_SENT_MESSAGE,
  classifyResetVisit,
  forgotPasswordPath,
  passwordChangeError,
  passwordResetRedirect,
  passwordUpdateMessage,
  readResetLink,
  resetCallbackPath,
  resetContinuePath,
  resetExchangeProblem,
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

  it("sends a code or recovery token hash to the callback and keeps other links on the page", () => {
    const code = classifyResetVisit({ code: "abc" });
    expect(code.kind).toBe("exchange");
    if (code.kind === "exchange") {
      expect(resetCallbackPath(code)).toBe("/auth/reset-callback?code=abc");
    }

    const otp = classifyResetVisit({ token_hash: "th", type: "recovery" });
    expect(otp.kind).toBe("exchange");
    if (otp.kind === "exchange") {
      expect(resetCallbackPath(otp)).toBe(
        "/auth/reset-callback?token_hash=th&type=recovery",
      );
    }

    expect(classifyResetVisit({ token_hash: "th", type: "signup" }).kind).toBe("problem");
    expect(
      classifyResetVisit({
        error: "access_denied",
        error_code: "otp_expired",
        error_description: "Email link is invalid or has expired",
      }),
    ).toEqual({ kind: "problem", problem: "invalid" });
    expect(classifyResetVisit({ link: "browser" })).toEqual({
      kind: "problem",
      problem: "browser",
    });
    expect(classifyResetVisit({}).kind).toBe("page");
    expect(classifyResetVisit({ error: PASSWORD_MISMATCH_MESSAGE })).toMatchObject({
      kind: "page",
      error: PASSWORD_MISMATCH_MESSAGE,
    });
  });

  it("treats a missing verifier on a real code as the wrong browser", () => {
    const code = "34e770dd-9ff9-416c-87fa-43b31d7ef225";
    expect(
      resetExchangeProblem(
        { message: "PKCE code verifier not found in storage.", code: "pkce_code_verifier_not_found" },
        code,
      ),
    ).toBe("browser");
    expect(
      resetExchangeProblem(
        { message: "PKCE code verifier not found in storage." },
        "bogus",
      ),
    ).toBe("invalid");
    expect(resetExchangeProblem({ message: "Email link is invalid or has expired" }, code)).toBe(
      "invalid",
    );
  });
});

describe("password reset screens", () => {
  it("links therapist sign-in to forgot password and hides it on sign up", () => {
    const signIn = renderToStaticMarkup(
      createElement(JoinAuth, { initialMode: "signin" }),
    );
    expect(signIn).toContain('href="/forgot-password?from=join"');
    expect(signIn).toContain("Forgot password?");
    expect(signIn).toContain("rounded-card");
    expect(signIn).not.toContain('aria-label="Go home"');

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
    expect(html).toContain("rounded-card");
    expect(html).not.toContain('aria-label="Close"');
    expect(html).not.toContain(RESET_SENT_MESSAGE);
  });

  it("starts the reset page by checking the link", () => {
    const html = renderToStaticMarkup(createElement(ResetPasswordForm));
    expect(html).toContain("Choose a new password");
    expect(html).toContain("Checking your reset link…");
    expect(html).not.toContain(PASSWORD_UPDATED_MESSAGE);
    expect(html).not.toContain(RESET_LINK_INVALID_MESSAGE);
  });

  it("renders an enabled password form once the server has a session", () => {
    const html = renderToStaticMarkup(
      createElement(ResetPasswordForm, {
        initialPhase: "ready",
        initialError: PASSWORD_MISMATCH_MESSAGE,
        from: "join",
        returnTo: "/join",
      }),
    );
    expect(html).toContain("Choose a new password");
    expect(html).toContain('action="/auth/update-password"');
    expect(html).toContain('method="post"');
    expect(html).toContain('name="password"');
    expect(html).toContain('name="confirm"');
    expect(html).toMatch(new RegExp(`minLength="${PASSWORD_MIN_LENGTH}"`, "i"));
    expect(html).toContain('name="from" value="join"');
    expect(html).toContain('name="return" value="/join"');
    expect(html).toContain("passwords don");
    expect(html).toContain("match.");
    expect(html).toContain('role="alert"');
    expect(html).not.toContain("Checking your reset link…");
    expect(html).not.toMatch(/<button\b[^>]*\sdisabled(?:=|\s|>)/);
  });

  it("shows an invalid or other-browser link with a way to request another", () => {
    const invalid = renderToStaticMarkup(
      createElement(ResetPasswordForm, { initialPhase: "invalid" }),
    );
    expect(invalid).toContain(RESET_LINK_INVALID_MESSAGE);
    expect(invalid).toContain('href="/forgot-password"');
    expect(invalid).toContain("Request a new link");
    expect(invalid).not.toContain("Checking your reset link…");
    expect(invalid).not.toContain("Unable to authenticate.");
    expect(invalid).not.toContain('action="/auth/update-password"');

    const browser = renderToStaticMarkup(
      createElement(ResetPasswordForm, { initialPhase: "wrong-browser" }),
    );
    expect(browser).toContain(RESET_LINK_BROWSER_MESSAGE);
    expect(browser).toContain('href="/forgot-password"');
    expect(browser).not.toContain("Checking your reset link…");
  });
});
