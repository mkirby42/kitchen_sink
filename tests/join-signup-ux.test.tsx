import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProfileStartSuccessDialog } from "@/components/home/ProfileStartForm";
import { joinAuthErrorCopy } from "@/components/join/JoinAuth";

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
