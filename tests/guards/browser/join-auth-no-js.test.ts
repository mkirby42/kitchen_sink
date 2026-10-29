import { expect, test } from "@playwright/test";

test.use({ javaScriptEnabled: false });

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
