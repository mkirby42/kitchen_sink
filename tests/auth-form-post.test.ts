import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthCookieCapture } from "@/lib/supabase/server";

const { createClient, auth, captureRef } = vi.hoisted(() => {
  const captureRef: { current: AuthCookieCapture | null } = { current: null };
  const auth = {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    signOut: vi.fn(),
  };
  return {
    auth,
    captureRef,
    createClient: vi.fn(async (capture: AuthCookieCapture) => {
      captureRef.current = capture;
      return { auth };
    }),
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh() {}, push() {}, replace() {} }),
}));

import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { AdminAuth } from "@/components/admin/AdminAuth";
import { JoinAuth } from "@/components/join/JoinAuth";
import { ReviewAuth } from "@/components/profile/ReviewAuth";
import { RESET_SENT_MESSAGE } from "@/lib/auth/password-reset";
import { postForgotPassword, postSignIn, postSignOut, postSignUp } from "@/lib/auth/form-post";

const password = "not-the-real-password";

function post(path: string, fields: Record<string, string>, origin = "https://kitchen-sink.test") {
  return new Request(`https://kitchen-sink.test${path}`, {
    method: "POST",
    headers: {
      origin,
      host: "kitchen-sink.test",
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(fields),
  });
}

function locationOf(response: Response) {
  const location = response.headers.get("location");
  expect(location).toBeTruthy();
  return new URL(location!);
}

describe("auth form posts", () => {
  beforeEach(() => {
    captureRef.current = null;
    createClient.mockClear();
    auth.signInWithPassword.mockReset();
    auth.signUp.mockReset();
    auth.resetPasswordForEmail.mockReset();
    auth.signOut.mockReset();
  });

  it("signs in and writes the session cookie on the 303", async () => {
    auth.signInWithPassword.mockImplementation(async () => {
      captureRef.current?.cookies.push({
        name: "sb-ref-auth-token",
        value: "session-token",
        options: { path: "/", httpOnly: false, sameSite: "lax" },
      });
      return { data: { session: { access_token: "t" } }, error: null };
    });

    const response = await postSignIn(
      post("/auth/sign-in", {
        email: "ada@example.com",
        password,
        scope: "join",
        next: "/join",
        back: "/join?mode=signin",
      }),
    );

    expect(response.status).toBe(303);
    const location = locationOf(response);
    expect(location.pathname).toBe("/join");
    expect(location.search).toBe("");
    expect(location.href).not.toContain(password);
    const setCookie = response.headers.getSetCookie().join("\n");
    expect(setCookie).toContain("sb-ref-auth-token=session-token");
    expect(setCookie).toContain("Path=/");
  });

  it("returns invalid credentials with the email filled in and no password", async () => {
    auth.signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { message: `Invalid login credentials ${password}` },
    });

    const response = await postSignIn(
      post("/auth/sign-in", {
        email: "ada@example.com",
        password,
        scope: "join",
        next: "/join",
        back: "/join?mode=signin",
      }),
    );

    expect(response.status).toBe(303);
    const location = locationOf(response);
    expect(location.pathname).toBe("/join");
    expect(location.searchParams.get("mode")).toBe("signin");
    expect(location.searchParams.get("email")).toBe("ada@example.com");
    expect(location.searchParams.get("error")).toBe("Invalid login credentials");
    expect(location.searchParams.get("password")).toBeNull();
    expect(location.href).not.toContain(password);
  });

  it("points an existing sign-up at Sign in", async () => {
    auth.signUp.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: "User already registered" },
    });

    const response = await postSignUp(
      post("/auth/sign-up", {
        email: "ada@example.com",
        password,
        scope: "join",
        next: "/join",
        back: "/join",
      }),
    );

    const location = locationOf(response);
    expect(location.pathname).toBe("/join");
    expect(location.searchParams.get("error")).toContain(
      "Switch to Sign in if you already have an account.",
    );
    expect(location.searchParams.get("email")).toBe("ada@example.com");
    expect(location.href).not.toContain(password);
    expect(auth.signUp).toHaveBeenCalledWith({ email: "ada@example.com", password });
  });

  it("sends a reset email, stores the code verifier, and confirms without leaking lookup", async () => {
    auth.resetPasswordForEmail.mockImplementation(async () => {
      captureRef.current?.cookies.push({
        name: "sb-ref-code-verifier",
        value: "verifier-value",
        options: { path: "/", httpOnly: false, sameSite: "lax", maxAge: 120 },
      });
      captureRef.current!.headers["Cache-Control"] =
        "private, no-cache, no-store, must-revalidate, max-age=0";
      return { error: { message: "User not found", code: "user_not_found" } };
    });

    const response = await postForgotPassword(
      post("/auth/forgot-password", {
        email: "ada@example.com",
        from: "join",
        return: "/join?mode=signin",
      }),
    );

    expect(response.status).toBe(303);
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("ada@example.com", {
      redirectTo: "https://kitchen-sink.test/reset-password",
    });
    const location = locationOf(response);
    expect(location.pathname).toBe("/forgot-password");
    expect(location.searchParams.get("sent")).toBe("1");
    expect(location.searchParams.get("from")).toBe("join");
    expect(location.searchParams.get("error")).toBeNull();
    expect(location.href.toLowerCase()).not.toContain("not found");
    expect(location.href).not.toContain(password);
    const setCookie = response.headers.getSetCookie().join("\n");
    expect(setCookie).toContain("sb-ref-code-verifier=verifier-value");
    expect(setCookie).toContain("Path=/");
    expect(setCookie.toLowerCase()).not.toContain("httponly");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("signs out and redirects to the sign-in form", async () => {
    auth.signOut.mockImplementation(async () => {
      captureRef.current?.cookies.push({
        name: "sb-ref-auth-token",
        value: "",
        options: { path: "/", maxAge: 0 },
      });
      return { error: null };
    });

    const response = await postSignOut(post("/auth/sign-out", {}));
    expect(response.status).toBe(303);
    const location = locationOf(response);
    expect(`${location.pathname}${location.search}`).toBe("/join?mode=signin");
    expect(response.headers.getSetCookie().join("\n")).toContain("Max-Age=0");
  });

  it("rejects a cross-site post", async () => {
    const response = await postSignIn(
      post(
        "/auth/sign-in",
        { email: "ada@example.com", password, scope: "join" },
        "https://evil.test",
      ),
    );
    expect(response.status).toBe(403);
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });
});

describe("auth error query rendering", () => {
  it("shows the sign-in error, keeps the email, and leaves submit enabled", () => {
    const html = renderToStaticMarkup(
      createElement(JoinAuth, {
        initialMode: "signin",
        initialEmail: "ada@example.com",
        initialError: "Invalid login credentials",
      }),
    );
    expect(html).toContain("Invalid login credentials");
    expect(html).toContain('value="ada@example.com"');
    expect(html).toContain('action="/auth/sign-in"');
    expect(html).toContain('method="post"');
    expect(html).toContain('name="email"');
    expect(html).toContain('name="password"');
    expect(html).not.toContain(password);
    expect(html).not.toMatch(/<button\b[^>]*\sdisabled(?:=|\s|>)/);
  });

  it("shows the same check-your-email confirmation as the browser flow", () => {
    const html = renderToStaticMarkup(
      createElement(ForgotPasswordForm, {
        from: "join",
        initialSent: true,
      }),
    );
    expect(html).toContain("Check your email");
    expect(html).toContain(RESET_SENT_MESSAGE);
    expect(html).not.toContain("Send reset link");
  });

  it("shows a reset failure with the email and a real form action", () => {
    const html = renderToStaticMarkup(
      createElement(ForgotPasswordForm, {
        from: "join",
        initialEmail: "ada@example.com",
        initialError: "Too many reset emails. Wait a few minutes and try again.",
      }),
    );
    expect(html).toContain("Too many reset emails. Wait a few minutes and try again.");
    expect(html).toContain('value="ada@example.com"');
    expect(html).toContain('action="/auth/forgot-password"');
    expect(html).toContain('method="post"');
    expect(html).not.toMatch(/<button\b[^>]*\sdisabled(?:=|\s|>)/);
  });

  it("keeps admin and review submit enabled with a post action", () => {
    const admin = renderToStaticMarkup(
      createElement(AdminAuth, {
        initialError: "Invalid login credentials",
        initialEmail: "ops@example.com",
      }),
    );
    expect(admin).toContain("Invalid login credentials");
    expect(admin).toContain('value="ops@example.com"');
    expect(admin).toContain('action="/auth/sign-in"');
    expect(admin).toContain('name="scope" value="admin"');
    expect(admin).not.toMatch(/<button\b[^>]*\sdisabled(?:=|\s|>)/);

    const review = renderToStaticMarkup(
      createElement(ReviewAuth, { returnTo: "/t/11111111-1111-4111-8111-111111111111" }),
    );
    expect(review).toContain('action="/auth/sign-in"');
    expect(review).toContain('method="post"');
    expect(review).toContain('name="scope" value="review"');
    expect(review).not.toMatch(/<button\b[^>]*\sdisabled(?:=|\s|>)/);
  });
});
