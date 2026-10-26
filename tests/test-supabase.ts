import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { assertTestProject } from "../scripts/seed-test/guard.mjs";

/** Dedicated test project only. Never reads NEXT_PUBLIC_* or a prod service role key. */
export type TestSupabaseEnv = {
  url: string;
  anonKey: string;
  serviceKey: string;
};

const clientOptions = {
  auth: { persistSession: false, autoRefreshToken: false },
} as const;

export function readTestSupabase(): TestSupabaseEnv | null {
  const url = process.env.TEST_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.TEST_SUPABASE_ANON_KEY?.trim() ?? "";
  const serviceKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  if (!url || !anonKey || !serviceKey) return null;
  return assertTestProject({ url, anonKey, serviceKey });
}

export function testSupabaseConfigured() {
  return readTestSupabase() !== null;
}

function requireTestSupabase() {
  const env = readTestSupabase();
  if (!env) {
    throw new Error(
      "Set TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY, and TEST_SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return env;
}

export function createTestAnonClient() {
  const env = requireTestSupabase();
  return createClient(env.url, env.anonKey, clientOptions);
}

export function createTestServiceClient() {
  const env = requireTestSupabase();
  return createClient(env.url, env.serviceKey, clientOptions);
}

/** Pages admin.listUsers the same way as scripts/seed-test/seed.mjs. */
export async function findAuthUserByEmail(
  service: SupabaseClient,
  email: string,
): Promise<User | null> {
  const needle = email.toLowerCase();
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await service.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw new Error(`list users: ${error.message}`);
    const hit = data.users.find((user) => user.email?.toLowerCase() === needle);
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

/** listUsers can lag a sign-up that just succeeded. */
export async function waitForAuthUser(
  service: SupabaseClient,
  email: string,
  timeoutMs = 8_000,
): Promise<User | null> {
  const started = Date.now();
  for (;;) {
    const user = await findAuthUserByEmail(service, email);
    if (user) return user;
    if (Date.now() - started >= timeoutMs) return null;
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
}

export async function deleteAuthUser(service: SupabaseClient, id: string) {
  const existing = await service.auth.admin.getUserById(id);
  if (existing.error || !existing.data.user) return;

  const profile = await service.from("profiles").delete().eq("id", id);
  if (profile.error) throw new Error(profile.error.message);

  const removed = await service.auth.admin.deleteUser(id);
  if (removed.error) throw new Error(removed.error.message);
}
