import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { ada, WORK_ANSWER } from "../../../scripts/seed-test/fixtures.mjs";
import {
  createTestServiceClient,
  deleteAuthUser,
  findAuthUserByEmail,
} from "../../test-supabase";

test.use({ javaScriptEnabled: false });

test(
  "fresh auth pages show no error alert",
  { tag: "@desktop-only" },
  async ({ page }) => {
    for (const path of ["/join?mode=signin", "/join", "/forgot-password"]) {
      await page.goto(path);
      await expect(page.getByRole("alert")).toHaveCount(0);
      await expect(page.getByText("Unable to authenticate.")).toHaveCount(0);
    }
  },
);

test(
  "join sign-in posts without JavaScript",
  { tag: "@desktop-only" },
  async ({ page }) => {
    await page.goto("/join?mode=signin");

    const button = page.getByRole("button", { name: "Sign in →" });
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();

    const form = page.locator("form").filter({ has: button });
    await expect(form).toHaveAttribute("method", "post");
    await expect(form).toHaveAttribute("action", "/auth/sign-in");

    const password = "not-the-real-password";
    await page.getByLabel("Email").fill("nobody-auth-nojs@example.com");
    await page.getByLabel("Password").fill(password);
    await button.click();

    await expect(page).toHaveURL(/\/join\?/);
    const url = new URL(page.url());
    expect(url.searchParams.get("mode")).toBe("signin");
    expect(url.searchParams.get("password")).toBeNull();
    expect(url.href).not.toContain(password);
    const error = url.searchParams.get("error");
    expect(error).toBeTruthy();
    await expect(page.getByRole("alert").filter({ hasText: error! })).toBeVisible();
    await expect(page.getByLabel("Email")).toHaveValue("nobody-auth-nojs@example.com");
    await expect(page.getByRole("button", { name: "Sign in →" })).toBeEnabled();
  },
);

test(
  "throwaway therapist signs in without JavaScript and lands on join",
  { tag: "@desktop-only" },
  async ({ page }) => {
    test.setTimeout(60_000);
    const email = `signin-nojs-${randomUUID()}@gmail.com`;
    const password = `Signin-${randomUUID()}Aa1`;
    const service = createTestServiceClient();
    let userId: string | null = null;

    try {
      const created = await service.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (created.error || !created.data.user) {
        throw new Error(created.error?.message ?? "admin createUser returned no user");
      }
      userId = created.data.user.id;

      await page.goto("/join?mode=signin");
      await expect(page.getByRole("alert")).toHaveCount(0);
      await expect(page.getByText("Unable to authenticate.")).toHaveCount(0);
      const button = page.getByRole("button", { name: "Sign in →" });
      await expect(button).toBeEnabled();
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password").fill(password);
      await button.click();

      await expect(page).toHaveURL(/\/join\/?$/);
      const url = new URL(page.url());
      expect(url.pathname).toBe("/join");
      expect(url.searchParams.get("mode")).toBeNull();
      expect(url.searchParams.get("error")).toBeNull();
      expect(url.searchParams.get("password")).toBeNull();
      expect(url.href).not.toContain(password);
      await expect(page.getByText("Step 1 of 4")).toBeVisible();
      await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
      await expect(page.getByRole("alert")).toHaveCount(0);
      await expect(page.getByText("Unable to authenticate.")).toHaveCount(0);
    } finally {
      if (userId) await deleteAuthUser(service, userId);
    }
  },
);

// The password input has minlength=6, so the browser blocks a too-short
// password before the native POST. An already-confirmed user makes Auth
// return "already registered" and does not send a confirmation email.
test(
  "join sign-up posts without JavaScript",
  { tag: "@desktop-only" },
  async ({ page }) => {
    test.setTimeout(60_000);
    const email = `signup-nojs-${randomUUID()}@gmail.com`;
    const password = `Signup-${randomUUID()}Aa1`;
    const service = createTestServiceClient();
    let userId: string | null = null;

    try {
      const created = await service.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (created.error || !created.data.user) {
        throw new Error(created.error?.message ?? "admin createUser returned no user");
      }
      userId = created.data.user.id;

      await page.goto("/join");
      await expect(page.getByRole("alert")).toHaveCount(0);
      await expect(page.getByText("Unable to authenticate.")).toHaveCount(0);
      const button = page.getByRole("button", { name: "Create account →" });
      await expect(button).toBeVisible();
      await expect(button).toBeEnabled();
      await expect(page.getByLabel("Password")).toHaveAttribute("minlength", "6");
      const form = page.locator("form").filter({ has: button });
      await expect(form).toHaveAttribute("method", "post");
      await expect(form).toHaveAttribute("action", "/auth/sign-up");
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password").fill(password);
      await button.click();

      await expect(page).toHaveURL(/\/join\?/);
      const url = new URL(page.url());
      expect(url.pathname).toBe("/join");
      expect(url.searchParams.get("mode")).toBeNull();
      const error = url.searchParams.get("error");
      expect(error).toMatch(/already registered/i);
      expect(url.searchParams.get("password")).toBeNull();
      expect(url.href).not.toContain(password);
      await expect(page.getByRole("alert").filter({ hasText: error! })).toBeVisible();
      await expect(page.getByLabel("Email")).toHaveValue(email);
      await expect(page.getByRole("button", { name: "Create account →" })).toBeEnabled();
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

// Same email cap as sign-up. Uses an address with no account; the screen
// still says check your email.
test(
  "forgot-password request reaches check your email without JavaScript",
  { tag: ["@desktop-only", "@chromium-only"] },
  async ({ page }) => {
    test.setTimeout(60_000);
    const email = `forgot-nojs-${randomUUID()}@example.test`;

    await page.goto("/forgot-password");
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.getByText("Unable to authenticate.")).toHaveCount(0);
    const button = page.getByRole("button", { name: "Send reset link" });
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
    const form = page.locator("form").filter({ has: button });
    await expect(form).toHaveAttribute("method", "post");
    await expect(form).toHaveAttribute("action", "/auth/forgot-password");
    await page.getByLabel("Email").fill(email);
    await button.click();

    await expect(page).toHaveURL(/\/forgot-password\?/);
    const url = new URL(page.url());
    expect(url.searchParams.get("sent")).toBe("1");
    expect(url.searchParams.get("error")).toBeNull();
    await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
    await expect(
      page.getByText(
        "If an account exists for that email, we sent a link to choose a new password. Check your inbox.",
      ),
    ).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.getByText("Unable to authenticate.")).toHaveCount(0);
  },
);

test(
  "Find renders therapist names without JavaScript",
  { tag: "@desktop-only" },
  async ({ page }) => {
    await page.goto("/find");
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.getByText("Unable to authenticate.")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Find your therapist" })).toBeVisible();
    await expect(page.getByRole("heading", { name: ada.name })).toBeVisible();
    await expect(page.getByText("Therapist search isn't available right now.")).toHaveCount(0);
    await expect(page.getByText("No therapists match")).toHaveCount(0);
  },
);

test(
  "a public profile renders without JavaScript",
  { tag: "@desktop-only" },
  async ({ page }) => {
    await page.goto(`/t/${ada.id}`);
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(page.getByText("Unable to authenticate.")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: ada.name })).toBeVisible();
    await expect(page.getByRole("heading", { name: "How Ada works" })).toBeVisible();
    await expect(page.getByText(WORK_ANSWER).filter({ visible: true })).toBeVisible();
    await expect(page.getByText("We couldn't find that therapist.")).toHaveCount(0);
  },
);
