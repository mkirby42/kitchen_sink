import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  createTestAnonClient,
  createTestServiceClient,
  deleteAuthUser,
  findAuthUserByEmail,
  testSupabaseConfigured,
  waitForAuthUser,
} from "../test-supabase";

describe.skipIf(!testSupabaseConfigured())("therapist signup creates an Auth user", () => {
  const email = `signup-e2e-${randomUUID()}@gmail.com`;
  const password = `Signup-${randomUUID()}Aa1`;

  afterAll(async () => {
    const service = createTestServiceClient();
    const user = await findAuthUserByEmail(service, email);
    if (user) await deleteAuthUser(service, user.id);
  });

  it("lands the new account in Auth", async () => {
    const anon = createTestAnonClient();
    const service = createTestServiceClient();
    const signUp = await anon.auth.signUp({ email, password });
    const user = await waitForAuthUser(service, email);

    if (!user) {
      throw new Error(signUp.error?.message ?? "signup created no Auth user");
    }

    expect(user.email?.toLowerCase()).toBe(email.toLowerCase());
  });
});
