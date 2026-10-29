import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const previousKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const setCookie = vi.fn(() => {
  throw new Error("cookies() are readonly here");
});

vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: () => [],
    set: setCookie,
  }),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _key: string,
    options: {
      cookies: {
        setAll: (
          cookies: {
            name: string;
            value: string;
            options: { path?: string; httpOnly?: boolean; sameSite?: "lax" };
          }[],
          headers: Record<string, string>,
        ) => void;
      };
    },
  ) => {
    options.cookies.setAll(
      [
        {
          name: "sb-ref-code-verifier",
          value: "verifier-value",
          options: { path: "/", httpOnly: false, sameSite: "lax" },
        },
      ],
      { "Cache-Control": "private, no-store" },
    );
    return { auth: {} };
  },
}));

import { createClient } from "@/lib/supabase/server";

describe("server auth cookie capture", () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  afterAll(() => {
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousKey;
  });

  it("keeps the PKCE verifier when the cookie store cannot write", async () => {
    const capture: {
      cookies: {
        name: string;
        value: string;
        options: { path?: string; httpOnly?: boolean; sameSite?: "lax" };
      }[];
      headers: Record<string, string>;
    } = { cookies: [], headers: {} };
    await createClient(capture);
    expect(setCookie).toHaveBeenCalled();
    expect(capture.cookies).toEqual([
      {
        name: "sb-ref-code-verifier",
        value: "verifier-value",
        options: { path: "/", httpOnly: false, sameSite: "lax" },
      },
    ]);
    expect(capture.headers["Cache-Control"]).toBe("private, no-store");
  });
});
