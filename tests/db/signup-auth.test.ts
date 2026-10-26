import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import {
  createTestServiceClient,
  deleteAuthUser,
  findAuthUserByEmail,
  testSupabaseConfigured,
} from "../test-supabase";

describe.skipIf(!testSupabaseConfigured())("therapist signup creates an Auth user", () => {
  const email = `signup-e2e-${randomUUID()}@gmail.com`;
  const password = `Signup-${randomUUID()}Aa1`;
  let userId: string | null = null;

  afterAll(async () => {
    if (!userId) return;
    const service = createTestServiceClient();
    await deleteAuthUser(service, userId);
  });

  it("lands the new account in Auth", async () => {
    const service = createTestServiceClient();
    // Hosted test Auth's built-in email is 2/hour project-wide, so public
    // signUp would hit "email rate limit exceeded". Admin createUser with
    // email_confirm skips that send and still lands a real Auth row.
    const created = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (created.error || !created.data.user) {
      throw new Error(created.error?.message ?? "admin createUser returned no user");
    }
    userId = created.data.user.id;

    const user = await findAuthUserByEmail(service, email);
    if (!user) {
      throw new Error(`Auth user not findable after createUser for ${email}`);
    }

    expect(user.id).toBe(userId);
    expect(user.email?.toLowerCase()).toBe(email.toLowerCase());
  });
});
