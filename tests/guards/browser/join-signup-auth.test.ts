import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import {
  createTestServiceClient,
  deleteAuthUser,
  findAuthUserByEmail,
  testSupabaseConfigured,
} from "../../test-supabase";

/** Prefer the visible form alert with text (layout may also expose an empty live region). */
async function formAlertText(page: Page): Promise<string> {
  const alert = page.getByRole("alert").filter({ hasText: /./ }).first();
  if (!(await alert.count()) || !(await alert.isVisible())) return "";
  return ((await alert.textContent()) ?? "").trim();
}

/** Sign-in left the auth form for the join wizard, a profile, or a hard nav off mode=signin. */
async function leftSignIn(page: Page): Promise<boolean> {
  const url = new URL(page.url());
  if (url.pathname === "/join" && url.searchParams.get("mode") !== "signin") return true;
  if (url.pathname.startsWith("/t/")) return true;
  if (await page.getByText("Step 1 of 4").isVisible()) return true;
  if (await page.getByText("Signing you in…").isVisible()) return true;
  return false;
}

test(
  "therapist Auth user lands and sign-in leaves the form",
  { tag: "@desktop-only" },
  async ({ page }) => {
    test.skip(!testSupabaseConfigured(), "TEST_SUPABASE_* is not configured");
    test.setTimeout(60_000);

    const email = `signup-e2e-${randomUUID()}@gmail.com`;
    const password = `Signup-${randomUUID()}Aa1`;
    const service = createTestServiceClient();
    let userId: string | null = null;

    try {
      // Do not call public signUp: hosted test Auth's built-in email is 2/hour
      // project-wide and returns "email rate limit exceeded". Admin createUser
      // with email_confirm is the day-1 Auth landing check.
      const created = await service.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (created.error || !created.data.user) {
        throw new Error(created.error?.message ?? "admin createUser returned no user");
      }
      userId = created.data.user.id;

      const authUser = await findAuthUserByEmail(service, email);
      expect(authUser?.id).toBe(userId);
      expect(authUser?.email?.toLowerCase()).toBe(email.toLowerCase());

      // Exercise the #131 session hard-nav: sign-in that returns a session must
      // leave the sign-in form (join wizard / profile / hard nav to /join).
      await page.goto("/join?mode=signin");
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password").fill(password);
      await page.getByRole("button", { name: "Sign in →" }).click();

      try {
        await expect
          .poll(async () => leftSignIn(page), {
            timeout: 20_000,
            intervals: [400, 800, 1200],
          })
          .toBe(true);
      } catch (error) {
        const alertText = await formAlertText(page);
        throw new Error(
          alertText
            ? `Therapist sign-in did not leave the form for ${email}: ${alertText}`
            : `Therapist sign-in did not leave the form for ${email}.`,
          { cause: error },
        );
      }
    } finally {
      if (userId) {
        await deleteAuthUser(service, userId);
      } else {
        const user = await findAuthUserByEmail(service, email);
        if (user) await deleteAuthUser(service, user.id);
      }
    }
  },
);
