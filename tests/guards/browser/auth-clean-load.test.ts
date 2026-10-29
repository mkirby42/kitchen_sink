// JavaScript on. Catches a hydration error the no-JS clean-load test cannot see.
import { expect, test } from "@playwright/test";
import { expectQuietAuth } from "./support";

test("fresh auth pages stay quiet with an enabled submit", async ({ page }) => {
  await page.goto("/join?mode=signin");
  const signIn = page.getByRole("button", { name: "Sign in →" });
  await expect(signIn).toBeVisible();
  await expect(signIn).toBeEnabled();
  await expectQuietAuth(page);

  await page.goto("/join");
  const create = page.getByRole("button", { name: "Create account →" });
  await expect(create).toBeVisible();
  await expect(create).toBeEnabled();
  await expectQuietAuth(page);

  await page.goto("/forgot-password");
  const send = page.getByRole("button", { name: "Send reset link" });
  await expect(send).toBeVisible();
  await expect(send).toBeEnabled();
  await expectQuietAuth(page);
});
