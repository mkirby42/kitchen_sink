import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import {
  createTestServiceClient,
  deleteAuthUser,
  findAuthUserByEmail,
  testSupabaseConfigured,
} from "../../test-supabase";

const CREATED = "Account created. Continuing…";
const CONFIRM = "Check your email to confirm, then sign in.";

/** Signup form outcome. A session navigates to the join wizard; confirmation stays on the form. */
async function signupSignal(page: Page) {
  if (await page.getByRole("alert").isVisible()) return "alert";
  if (await page.getByText(CREATED).isVisible()) return "created";
  if (await page.getByText(CONFIRM).isVisible()) return "confirm";
  const url = new URL(page.url());
  if (url.pathname === "/join" && url.searchParams.get("mode") !== "signup") return "left-signup";
  if (await page.getByText("Step 1 of 4").isVisible()) return "left-signup";
  return "";
}

test("therapist sign-up creates an Auth user", async ({ page }) => {
  test.skip(!testSupabaseConfigured(), "TEST_SUPABASE_* is not configured");
  test.setTimeout(60_000);

  const email = `signup-e2e-${randomUUID()}@example.test`;
  const password = `Signup-${randomUUID()}Aa1`;
  const service = createTestServiceClient();

  try {
    await page.goto("/join?mode=signup");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Create account →" }).click();

    // Success copy, the join wizard, or an error. Auth is the day-1 check, including
    // when the form only says to confirm email.
    let signal = "";
    try {
      await expect
        .poll(
          async () => {
            const user = await findAuthUserByEmail(service, email);
            if (user?.email?.toLowerCase() === email.toLowerCase()) return "user";
            signal = await signupSignal(page);
            return signal;
          },
          { timeout: 20_000, intervals: [400, 800, 1200] },
        )
        .not.toBe("");
    } catch (error) {
      const user = await findAuthUserByEmail(service, email);
      if (user?.email?.toLowerCase() !== email.toLowerCase()) {
        const alertText = (await page.getByRole("alert").textContent())?.trim();
        throw new Error(
          alertText
            ? `Therapist sign-up did not create an Auth user for ${email}: ${alertText}`
            : `Therapist sign-up did not create an Auth user for ${email}.`,
          { cause: error },
        );
      }
    }

    const sawAlert = signal === "alert" || (await page.getByRole("alert").isVisible());
    const alertText = sawAlert
      ? (await page.getByRole("alert").textContent())?.trim() ?? ""
      : "";

    let authEmail = "";
    try {
      await expect
        .poll(
          async () => {
            const user = await findAuthUserByEmail(service, email);
            authEmail = user?.email?.toLowerCase() ?? "";
            return authEmail;
          },
          { timeout: sawAlert ? 8_000 : 20_000, intervals: [400, 800, 1200] },
        )
        .toBe(email.toLowerCase());
    } catch (error) {
      if (alertText) {
        throw new Error(
          `Therapist sign-up did not create an Auth user for ${email}: ${alertText}`,
          { cause: error },
        );
      }
      throw new Error(`Therapist sign-up did not create an Auth user for ${email}.`, {
        cause: error,
      });
    }

    expect(authEmail).toBe(email.toLowerCase());
  } finally {
    const user = await findAuthUserByEmail(service, email);
    if (user) await deleteAuthUser(service, user.id);
  }
});
