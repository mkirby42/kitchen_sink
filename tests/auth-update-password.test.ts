import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthCookieCapture } from "@/lib/supabase/server";
import { PASSWORD_MISMATCH_MESSAGE } from "@/lib/auth/password-reset";

const { createClient, auth, captureRef, profileStarts } = vi.hoisted(() => {
  const captureRef: { current: AuthCookieCapture | null } = { current: null };
  const profileStarts = vi.fn(async () => ({ data: [] as { id: string }[], error: null }));
  const auth = {
    getUser: vi.fn(),
    updateUser: vi.fn(),
    exchangeCodeForSession: vi.fn(),
    verifyOtp: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    signOut: vi.fn(),
  };
  return {
    auth,
    captureRef,
    profileStarts,
    createClient: vi.fn(async (capture: AuthCookieCapture) => {
      captureRef.current = capture;
      return {
        auth,
        from: () => ({
          select: () => ({
            eq: () => ({
              in: () => ({
                limit: profileStarts,
              }),
            }),
          }),
        }),
      };
    }),
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient,
}));

import { getResetCallback, postUpdatePassword } from "@/lib/auth/form-post";

const password = "not-the-real-password";
const code = "34e770dd-9ff9-416c-87fa-43b31d7ef225";

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

function get(path: string) {
  return new Request(`https://kitchen-sink.test${path}`, {
    method: "GET",
    headers: { host: "kitchen-sink.test" },
  });
}

function locationOf(response: Response) {
  const location = response.headers.get("location");
  expect(location).toBeTruthy();
  return new URL(location!);
}

describe("update password form post", () => {
  beforeEach(() => {
    captureRef.current = null;
    createClient.mockClear();
    profileStarts.mockReset();
    profileStarts.mockResolvedValue({ data: [], error: null });
    auth.getUser.mockReset();
    auth.updateUser.mockReset();
    auth.exchangeCodeForSession.mockReset();
    auth.verifyOtp.mockReset();
  });

  it("rejects a cross-site post", async () => {
    const response = await postUpdatePassword(
      post(
        "/auth/update-password",
        { password, confirm: password },
        "https://evil.test",
      ),
    );
    expect(response.status).toBe(403);
    expect(auth.getUser).not.toHaveBeenCalled();
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("sends a missing session back to an invalid reset link", async () => {
    auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const response = await postUpdatePassword(
      post("/auth/update-password", { password, confirm: password }),
    );
    expect(response.status).toBe(303);
    const location = locationOf(response);
    expect(location.pathname).toBe("/reset-password");
    expect(location.searchParams.get("link")).toBe("invalid");
    expect(location.href).not.toContain(password);
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("rejects a mismatch and keeps the password out of the address", async () => {
    auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    const response = await postUpdatePassword(
      post("/auth/update-password", {
        password: "long-enough",
        confirm: "different-1",
        from: "join",
      }),
    );
    expect(response.status).toBe(303);
    const location = locationOf(response);
    expect(location.pathname).toBe("/reset-password");
    expect(location.searchParams.get("error")).toBe(PASSWORD_MISMATCH_MESSAGE);
    expect(location.searchParams.get("from")).toBe("join");
    expect(location.searchParams.get("password")).toBeNull();
    expect(location.href).not.toContain("long-enough");
    expect(location.href).not.toContain("different-1");
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("rejects a too-short password", async () => {
    auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    const response = await postUpdatePassword(
      post("/auth/update-password", { password: "short", confirm: "short" }),
    );
    const location = locationOf(response);
    expect(location.pathname).toBe("/reset-password");
    expect(location.searchParams.get("error")).toMatch(/at least 6/i);
    expect(location.href).not.toContain("short");
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("updates the password and 303s to the continue path without the password", async () => {
    auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    auth.updateUser.mockImplementation(async () => {
      captureRef.current?.cookies.push({
        name: "sb-ref-auth-token",
        value: "session-token",
        options: { path: "/", sameSite: "lax" },
      });
      return { error: null };
    });

    const response = await postUpdatePassword(
      post("/auth/update-password", { password, confirm: password }),
    );
    expect(response.status).toBe(303);
    expect(auth.updateUser).toHaveBeenCalledWith({ password });
    const location = locationOf(response);
    expect(location.pathname).toBe("/");
    expect(location.searchParams.get("updated")).toBe("1");
    expect(location.searchParams.get("password")).toBeNull();
    expect(location.href).not.toContain(password);
    const setCookie = response.headers.getSetCookie().join("\n");
    expect(setCookie).toContain("sb-ref-auth-token=session-token");
    expect(setCookie).toContain("ks-password-updated=1");
  });

  it("follows from, return, and an open profile start", async () => {
    auth.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    auth.updateUser.mockResolvedValue({ error: null });

    const joined = await postUpdatePassword(
      post("/auth/update-password", { password, confirm: password, from: "join" }),
    );
    expect(locationOf(joined).pathname).toBe("/join");
    expect(locationOf(joined).searchParams.get("updated")).toBe("1");
    expect(locationOf(joined).href).not.toContain(password);

    const returned = await postUpdatePassword(
      post("/auth/update-password", {
        password,
        confirm: password,
        return: "/admin/media",
      }),
    );
    expect(locationOf(returned).pathname).toBe("/admin/media");
    expect(locationOf(returned).href).not.toContain(password);

    profileStarts.mockResolvedValue({ data: [{ id: "start-1" }], error: null });
    const draft = await postUpdatePassword(
      post("/auth/update-password", { password, confirm: password }),
    );
    const draftLocation = locationOf(draft);
    expect(draftLocation.pathname).toBe("/join");
    expect(draftLocation.searchParams.get("edit")).toBe("1");
    expect(draftLocation.searchParams.get("updated")).toBe("1");
  });
});

describe("reset callback", () => {
  beforeEach(() => {
    captureRef.current = null;
    createClient.mockClear();
    auth.exchangeCodeForSession.mockReset();
    auth.verifyOtp.mockReset();
  });

  it("exchanges a code, stores the session, and drops the code from the address", async () => {
    auth.exchangeCodeForSession.mockImplementation(async () => {
      captureRef.current?.cookies.push({
        name: "sb-ref-auth-token",
        value: "session-token",
        options: { path: "/", sameSite: "lax" },
      });
      return { error: null };
    });

    const response = await getResetCallback(
      get(`/auth/reset-callback?code=${code}&from=join`),
    );
    expect(response.status).toBe(303);
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith(code, undefined);
    const location = locationOf(response);
    expect(location.pathname).toBe("/reset-password");
    expect(location.searchParams.get("code")).toBeNull();
    expect(location.searchParams.get("from")).toBe("join");
    expect(response.headers.getSetCookie().join("\n")).toContain("sb-ref-auth-token=session-token");
  });

  it("maps a missing verifier on a real code to the other-browser message", async () => {
    auth.exchangeCodeForSession.mockResolvedValue({
      error: {
        message: "PKCE code verifier not found in storage.",
        code: "pkce_code_verifier_not_found",
      },
    });
    const response = await getResetCallback(get(`/auth/reset-callback?code=${code}`));
    const location = locationOf(response);
    expect(location.pathname).toBe("/reset-password");
    expect(location.searchParams.get("link")).toBe("browser");
    expect(location.searchParams.get("code")).toBeNull();
  });

  it("treats a bogus code as an invalid link", async () => {
    auth.exchangeCodeForSession.mockResolvedValue({
      error: { message: "PKCE code verifier not found in storage." },
    });
    const response = await getResetCallback(get("/auth/reset-callback?code=bogus"));
    expect(locationOf(response).searchParams.get("link")).toBe("invalid");
  });

  it("verifies a recovery token hash and leaves a clean reset url", async () => {
    auth.verifyOtp.mockImplementation(async () => {
      captureRef.current?.cookies.push({
        name: "sb-ref-auth-token",
        value: "session-token",
        options: { path: "/" },
      });
      return { error: null };
    });
    const response = await getResetCallback(
      get("/auth/reset-callback?token_hash=hashed-token&type=recovery"),
    );
    expect(auth.verifyOtp).toHaveBeenCalledWith({
      type: "recovery",
      token_hash: "hashed-token",
    });
    const location = locationOf(response);
    expect(`${location.pathname}${location.search}`).toBe("/reset-password");
    expect(location.href).not.toContain("hashed-token");
    expect(response.headers.getSetCookie().join("\n")).toContain("sb-ref-auth-token=session-token");
  });
});
