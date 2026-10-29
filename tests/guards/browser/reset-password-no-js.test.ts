import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import {
  PASSWORD_MISMATCH_MESSAGE,
  PASSWORD_UPDATED_MESSAGE,
  RESET_LINK_INVALID_MESSAGE,
} from "@/lib/auth/password-reset";
import {
  createTestServiceClient,
  deleteAuthUser,
} from "../../test-supabase";

// Same origin the Playwright webServer serves. generateLink does not send mail.
const resetRedirectTo = "http://127.0.0.1:3000/reset-password";

test.use({ javaScriptEnabled: false });

test(
  "join sign-up and sign-in toggle without JavaScript",
  { tag: "@desktop-only" },
  async ({ page }) => {
    await page.goto("/join");
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.getByText("Unable to authenticate.")).toHaveCount(0);

    await page.getByRole("link", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/join\?mode=signin$/);
    await expect(page.getByRole("button", { name: "Sign in →" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);

    await page.getByRole("link", { name: "Sign up", exact: true }).click();
    await expect(page).toHaveURL(/\/join\/?$/);
    await expect(page.getByRole("button", { name: "Create account →" })).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.getByText("Unable to authenticate.")).toHaveCount(0);
  },
);

test(
  "a bogus or expired reset link explains itself without JavaScript",
  { tag: "@desktop-only" },
  async ({ page }) => {
    await page.goto("/reset-password?code=bogus");
    await expect(page.getByText("Checking your reset link…")).toHaveCount(0);
    await expect(page.getByText("Unable to authenticate.")).toHaveCount(0);
    await expect(page.getByText(RESET_LINK_INVALID_MESSAGE)).toBeVisible();
    await expect(page.getByRole("link", { name: "Request a new link" })).toHaveAttribute(
      "href",
      "/forgot-password",
    );

    await page.goto(
      "/reset-password?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired",
    );
    await expect(page.getByText("Checking your reset link…")).toHaveCount(0);
    await expect(page.getByText("Unable to authenticate.")).toHaveCount(0);
    await expect(page.getByText(RESET_LINK_INVALID_MESSAGE)).toBeVisible();
    await expect(page.getByRole("link", { name: "Request a new link" })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
  },
);

async function resetThrowawayPassword(page: Page) {
  const email = `reset-nojs-${randomUUID()}@gmail.com`;
  const oldPassword = `Old-${randomUUID()}Aa1`;
  const newPassword = `New-${randomUUID()}Aa1`;
  const service = createTestServiceClient();
  let userId: string | null = null;

  try {
    const created = await service.auth.admin.createUser({
      email,
      password: oldPassword,
      email_confirm: true,
    });
    if (created.error || !created.data.user) {
      throw new Error(created.error?.message ?? "admin createUser returned no user");
    }
    userId = created.data.user.id;

    const link = await service.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: resetRedirectTo },
    });
    const token = link.data.properties?.hashed_token;
    if (link.error || !token) {
      throw new Error(link.error?.message ?? "generateLink returned no hashed_token");
    }

    await page.goto(
      `/reset-password?token_hash=${encodeURIComponent(token)}&type=recovery`,
    );
    const submit = page.getByRole("button", { name: "Update password" });
    await expect(submit).toBeVisible();
    await expect(submit).toBeEnabled();
    await expect(page.getByText("Checking your reset link…")).toHaveCount(0);
    await expect(page.getByLabel("New password")).toHaveAttribute("minlength", "6");

    await page.getByLabel("New password").fill("not-the-same");
    await page.getByLabel("Confirm password").fill("also-not-same");
    await submit.click();
    await expect(page.getByRole("alert").filter({ hasText: PASSWORD_MISMATCH_MESSAGE })).toBeVisible();
    expect(page.url()).not.toContain("not-the-same");
    expect(page.url()).not.toContain("also-not-same");
    await expect(page.getByRole("button", { name: "Update password" })).toBeEnabled();

    await page.getByLabel("New password").fill(newPassword);
    await page.getByLabel("Confirm password").fill(newPassword);
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByText(PASSWORD_UPDATED_MESSAGE)).toBeVisible();
    expect(page.url()).not.toContain(newPassword);
    expect(new URL(page.url()).searchParams.get("password")).toBeNull();

    await page.goto("/join");
    await expect(page.getByText("Step 1 of 4")).toBeVisible();
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/join\?mode=signin/);

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(oldPassword);
    await page.getByRole("button", { name: "Sign in →" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByText("Step 1 of 4")).toHaveCount(0);
    expect(page.url()).not.toContain(oldPassword);

    await page.getByLabel("Password").fill(newPassword);
    await page.getByRole("button", { name: "Sign in →" }).click();
    await expect(page.getByText("Step 1 of 4")).toBeVisible();
    expect(page.url()).not.toContain(newPassword);
  } finally {
    if (userId) await deleteAuthUser(service, userId);
  }
}

test(
  "reset password posts without JavaScript",
  { tag: "@desktop-only" },
  async ({ page }) => {
    test.setTimeout(90_000);
    await resetThrowawayPassword(page);
  },
);

test.describe("reset password with JavaScript", () => {
  test.use({ javaScriptEnabled: true });

  test(
    "token hash reset still signs in with JavaScript",
    { tag: "@desktop-only" },
    async ({ page }) => {
      test.setTimeout(90_000);
      await resetThrowawayPassword(page);
    },
  );
});
