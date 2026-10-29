import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh() {}, push() {}, replace() {} }),
}));

import { ProfileStartSuccessDialog } from "@/components/home/ProfileStartForm";
import { JoinAuth, joinAuthErrorCopy } from "@/components/join/JoinAuth";
import { joinModeHref } from "@/lib/join/mode-href";
import { AdminAuth } from "@/components/admin/AdminAuth";

const CONFIRMATION =
  "We'll email you when your draft is ready to review. Nothing goes live until you approve it.";

describe("join auth errors", () => {
  it("keeps an already-registered error and hints to sign in", () => {
    expect(joinAuthErrorCopy("User already registered")).toBe(
      "User already registered. Switch to Sign in if you already have an account.",
    );
    expect(joinAuthErrorCopy("A user with this email address has already been registered")).toContain(
      "already been registered",
    );
    expect(joinAuthErrorCopy("Invalid login credentials")).toBe("Invalid login credentials");
  });
});

describe("join and admin auth screens", () => {
  it("keeps sign-up and sign-in controls and forgot-password on sign-in", () => {
    const signIn = renderToStaticMarkup(
      createElement(JoinAuth, { initialMode: "signin" }),
    );
    expect(signIn).toContain("Sign in");
    expect(signIn).toContain('href="/forgot-password?from=join"');
    expect(signIn).toContain("Forgot password?");
    expect(signIn).toContain('method="post"');

    const signUp = renderToStaticMarkup(
      createElement(JoinAuth, { initialMode: "signup" }),
    );
    expect(signUp).toContain("Create account");
    expect(signUp).not.toContain("Forgot password?");
    expect(signUp).toContain('href="/join?mode=signin"');
    expect(signUp).toMatch(/href="\/join"/);
    expect(signIn).toContain('aria-current="page"');
  });

  it("keeps join mode links and drops the auth flash", () => {
    expect(
      joinModeHref("signin", {
        mode: "signup",
        next: "/find",
        back: "/join",
        scope: "join",
        error: "Invalid login credentials",
        email: "ada@example.com",
      }),
    ).toBe("/join?next=%2Ffind&back=%2Fjoin&scope=join&mode=signin");
    expect(
      joinModeHref("signup", {
        mode: "signin",
        next: "/find",
        scope: "join",
      }),
    ).toBe("/join?next=%2Ffind&scope=join");
    expect(joinModeHref("signup", { mode: "signup" })).toBe("/join");
  });

  it("keeps admin sign-in fields and forgot-password", () => {
    const html = renderToStaticMarkup(createElement(AdminAuth, {}));
    expect(html).toContain("Sign in");
    expect(html).toContain('href="/forgot-password?from=admin"');
    expect(html).toContain('method="post"');
  });
});

describe("profile start success dialog", () => {
  it("renders a dialog with the confirmation", () => {
    const html = renderToStaticMarkup(
      createElement(ProfileStartSuccessDialog, {
        message: CONFIRMATION,
        onDismiss() {},
      }),
    );

    expect(html).toMatch(/<dialog/);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain("You&#x27;re in.");
    expect(html).toContain("Request submitted");
    expect(html).toContain("email you when your draft is ready to review");
    expect(html).toContain("Nothing goes live until you approve it.");
    expect(html).toContain("Got it");
    expect(html).toContain("rounded-card");
  });
});
