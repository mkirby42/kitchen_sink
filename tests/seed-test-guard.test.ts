import { describe, expect, it } from "vitest";
import {
  PROD_REF,
  TEST_REF,
  assertTestProject,
} from "../scripts/seed-test/guard.mjs";
import { readTestSupabase } from "./test-supabase";

function jwt(payload: Record<string, string>) {
  return `header.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.sig`;
}

const anon = jwt({ ref: TEST_REF, role: "anon" });
const service = jwt({ ref: TEST_REF, role: "service_role" });
const url = `https://${TEST_REF}.supabase.co`;

describe("test project seed guard", () => {
  it("accepts only the test project anon and service role keys", () => {
    expect(assertTestProject({ url, anonKey: anon, serviceKey: service }).url).toBe(url);
  });

  it("refuses a missing secret instead of reading the prod env", () => {
    expect(() => assertTestProject({ url, anonKey: anon, serviceKey: "" })).toThrow(
      /TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY, and TEST_SUPABASE_SERVICE_ROLE_KEY/,
    );
    expect(() => assertTestProject({ url, anonKey: anon, serviceKey: "" })).toThrow(
      /does not read NEXT_PUBLIC_SUPABASE_URL/,
    );
  });

  it("refuses the production project ref", () => {
    const prodUrl = `https://${PROD_REF}.supabase.co`;
    const prodAnon = jwt({ ref: PROD_REF, role: "anon" });
    const prodService = jwt({ ref: PROD_REF, role: "service_role" });
    expect(() =>
      assertTestProject({ url: prodUrl, anonKey: prodAnon, serviceKey: prodService }),
    ).toThrow(PROD_REF);
    expect(() =>
      assertTestProject({ url, anonKey: prodAnon, serviceKey: service }),
    ).toThrow(PROD_REF);
    expect(() =>
      assertTestProject({ url, anonKey: anon, serviceKey: prodService }),
    ).toThrow(PROD_REF);
  });

  it("refuses a different project and a swapped key", () => {
    expect(() =>
      assertTestProject({
        url: "https://otherproject.supabase.co",
        anonKey: jwt({ ref: "otherproject", role: "anon" }),
        serviceKey: jwt({ ref: "otherproject", role: "service_role" }),
      }),
    ).toThrow(/Only kxlonrjirrrjiinclamc/);
    expect(() =>
      assertTestProject({
        url,
        anonKey: service,
        serviceKey: anon,
      }),
    ).toThrow(/anon key/);
  });

  it("stays unconfigured when TEST_SUPABASE_* is missing, even if prod env is set", () => {
    const keys = [
      "TEST_SUPABASE_URL",
      "TEST_SUPABASE_ANON_KEY",
      "TEST_SUPABASE_SERVICE_ROLE_KEY",
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "SUPABASE_SERVICE_ROLE_KEY_KITCHEN_SINK",
    ];
    const saved = new Map(keys.map((key) => [key, process.env[key]]));
    try {
      for (const key of keys) delete process.env[key];
      process.env.NEXT_PUBLIC_SUPABASE_URL = `https://${PROD_REF}.supabase.co`;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = jwt({ ref: PROD_REF, role: "anon" });
      process.env.SUPABASE_SERVICE_ROLE_KEY = jwt({ ref: PROD_REF, role: "service_role" });
      process.env.SUPABASE_SERVICE_ROLE_KEY_KITCHEN_SINK = jwt({
        ref: PROD_REF,
        role: "service_role",
      });
      expect(readTestSupabase()).toBeNull();

      process.env.TEST_SUPABASE_URL = url;
      expect(readTestSupabase()).toBeNull();
    } finally {
      for (const [key, value] of saved) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });

  it("refuses TEST_SUPABASE_* when it points at production", () => {
    const keys = [
      "TEST_SUPABASE_URL",
      "TEST_SUPABASE_ANON_KEY",
      "TEST_SUPABASE_SERVICE_ROLE_KEY",
    ] as const;
    const saved = new Map(keys.map((key) => [key, process.env[key]]));
    try {
      process.env.TEST_SUPABASE_URL = `https://${PROD_REF}.supabase.co`;
      process.env.TEST_SUPABASE_ANON_KEY = jwt({ ref: PROD_REF, role: "anon" });
      process.env.TEST_SUPABASE_SERVICE_ROLE_KEY = jwt({
        ref: PROD_REF,
        role: "service_role",
      });
      expect(() => readTestSupabase()).toThrow(PROD_REF);
    } finally {
      for (const [key, value] of saved) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });
});
