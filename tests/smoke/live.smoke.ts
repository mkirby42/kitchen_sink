// Read-only. Never submits forms. Blocks analytics writes.

import { expect, test, type Page, type Route } from "@playwright/test";

function isReadMethod(method: string) {
  return method === "GET" || method === "HEAD";
}

async function abortWrites(route: Route) {
  if (isReadMethod(route.request().method())) {
    await route.fallback();
    return;
  }
  await route.abort();
}

test.beforeEach(async ({ page }) => {
  await page.route("**/rest/v1/**", abortWrites);
  await page.route("**/auth/v1/**", abortWrites);
  await page.route("**/rest/v1/analytics_events**", (route) => route.abort());
});

/**
 * Next.js adds an empty route announcer (role=alert, inside a shadow root)
 * after hydration. Any other alert, or that text, is a real error banner.
 */
async function expectQuiet(page: Page) {
  await expectNoErrorBanner(page);
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 750)));
  await expectNoErrorBanner(page);
}

async function expectNoErrorBanner(page: Page) {
  await expect(page.getByText("Unable to authenticate.")).toHaveCount(0);
  const alerts = page.getByRole("alert");
  const count = await alerts.count();
  for (let i = 0; i < count; i += 1) {
    const alert = alerts.nth(i);
    expect(await alert.getAttribute("id")).toBe("__next-route-announcer__");
    await expect(alert).toHaveText("");
  }
}

test("home page loads", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/kitchen sink/i);
  await expectQuiet(page);
});

test("sign-in renders an enabled button and no error", async ({ page }) => {
  const response = await page.goto("/join?mode=signin");
  expect(response?.status()).toBe(200);
  const button = page.getByRole("button", { name: "Sign in →" });
  await expect(button).toBeVisible();
  await expect(button).toBeEnabled();
  await expectQuiet(page);
});

test("sign-up renders an enabled button and no error", async ({ page }) => {
  const response = await page.goto("/join");
  expect(response?.status()).toBe(200);
  const button = page.getByRole("button", { name: "Create account →" });
  await expect(button).toBeVisible();
  await expect(button).toBeEnabled();
  await expectQuiet(page);
});

test("forgot-password renders an enabled submit and no error", async ({ page }) => {
  const response = await page.goto("/forgot-password");
  expect(response?.status()).toBe(200);
  const button = page.getByRole("button", { name: "Send reset link" });
  await expect(button).toBeVisible();
  await expect(button).toBeEnabled();
  await expectQuiet(page);
});

test("Find shows a therapist card", async ({ page }) => {
  const response = await page.goto("/find");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Find your therapist" })).toBeVisible();
  await expect(page.locator("[data-find-card]").filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText("Therapist search isn't available right now.")).toHaveCount(0);
  await expect(page.getByText("No therapists match")).toHaveCount(0);
  await expectQuiet(page);
});

test("a public profile opens from the first Find link", async ({ page }) => {
  await page.goto("/find");
  const links = page.locator('a[href*="/t/"]');
  const visible = links.filter({ visible: true });
  const target = (await visible.count()) > 0 ? visible.first() : links.first();
  const href = await target.getAttribute("href");
  expect(href).toMatch(/\/t\/[0-9a-f-]{36}/i);
  // The phone card's play control sits on top of this link, so a center click
  // never reaches it. Follow the href the page rendered.
  await page.goto(href!);
  await expect(page).toHaveURL(/\/t\/[0-9a-f-]{36}/i);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("We couldn't find that therapist.")).toHaveCount(0);
  await expectQuiet(page);
});

test.describe("javascript disabled", () => {
  test.use({ javaScriptEnabled: false });

  test("sign-in button stays enabled", async ({ page }) => {
    const response = await page.goto("/join?mode=signin");
    expect(response?.status()).toBe(200);
    const button = page.getByRole("button", { name: "Sign in →" });
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
    await expectNoErrorBanner(page);
  });
});
