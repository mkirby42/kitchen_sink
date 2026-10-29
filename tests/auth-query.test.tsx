import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh() {}, push() {}, replace() {} }),
}));

import { AdminAuth } from "@/components/admin/AdminAuth";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { JoinAuth } from "@/components/join/JoinAuth";
import { ReviewAuth } from "@/components/profile/ReviewAuth";
import { AUTH_FAILED, readAuthQuery, sanitizeAuthError } from "@/lib/auth/auth-query";

describe("readAuthQuery", () => {
  it("returns a blank error when the param is missing or whitespace", () => {
    expect(readAuthQuery({})).toEqual({ error: "", email: "", sent: "" });
    expect(readAuthQuery({ error: "" }).error).toBe("");
    expect(readAuthQuery({ error: "  " }).error).toBe("");
    expect(readAuthQuery({ error: ["\n\t"] }).error).toBe("");
  });

  it("passes a real error through", () => {
    expect(readAuthQuery({ error: "Invalid login credentials" }).error).toBe(
      "Invalid login credentials",
    );
  });

  it("still replaces an unsafe non-empty error with AUTH_FAILED", () => {
    expect(readAuthQuery({ error: "\u0000\u0001" }).error).toBe(AUTH_FAILED);
    expect(readAuthQuery({ error: "x".repeat(241) }).error).toBe(AUTH_FAILED);
    expect(readAuthQuery({ error: "Bearer secret-token" }).error).toBe(AUTH_FAILED);
    expect(sanitizeAuthError("")).toBe(AUTH_FAILED);
  });
});

describe("blank auth flash does not render an alert", () => {
  it("leaves JoinAuth and ForgotPasswordForm without an alert", () => {
    const join = renderToStaticMarkup(
      createElement(JoinAuth, { initialMode: "signin", initialError: "" }),
    );
    const signup = renderToStaticMarkup(
      createElement(JoinAuth, { initialMode: "signup", initialError: "" }),
    );
    const forgot = renderToStaticMarkup(
      createElement(ForgotPasswordForm, { initialError: "" }),
    );

    for (const html of [join, signup, forgot]) {
      expect(html).not.toContain('role="alert"');
      expect(html).not.toContain(AUTH_FAILED);
    }
  });

  it("leaves admin and review sign-in without an alert", () => {
    const admin = renderToStaticMarkup(
      createElement(AdminAuth, { initialError: "" }),
    );
    const review = renderToStaticMarkup(
      createElement(ReviewAuth, { returnTo: "/find" }),
    );

    for (const html of [admin, review]) {
      expect(html).not.toContain('role="alert"');
      expect(html).not.toContain(AUTH_FAILED);
    }
  });
});
