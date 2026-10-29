import { expect, test } from "@playwright/test";
import { ada, openTherapists } from "../../../scripts/seed-test/fixtures.mjs";
import { isPhoneProject } from "./support";

const cora = openTherapists[2];

test.use({ javaScriptEnabled: false });

test("Find heading and a topic filter work without JavaScript", async ({ page }) => {
  await page.goto("/find");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Find your therapist" })).toBeVisible();

  const form = page.locator("form[data-find-no-js]:visible");
  await expect(form).toBeVisible();
  await expect(form.getByRole("group", { name: "Where you live" })).toBeVisible();
  await expect(form.getByRole("group", { name: "Insurance" })).toBeVisible();
  await expect(form.getByRole("group", { name: "What's going on" })).toBeVisible();
  await expect(form.getByRole("group", { name: "In person or online" })).toBeVisible();
  await expect(form.getByRole("button", { name: "Show therapists" })).toBeVisible();

  // Ada is Anxiety. Cora is Depression. The checkbox value is the stored tag.
  await form.getByRole("checkbox", { name: /Worry, stress or panic/ }).check();
  await form.getByRole("button", { name: "Show therapists" }).click();

  await expect(page).toHaveURL(/[?&]tags=Anxiety(?:&|$)/);
  await expect(page.getByText(ada.name, { exact: true }).filter({ visible: true })).toHaveCount(1);
  await expect(page.getByText(cora.name)).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("Find layout toggle works without JavaScript", async ({ page }, testInfo) => {
  await page.goto("/find");

  if (isPhoneProject(testInfo)) {
    await page.getByRole("link", { name: "One at a time" }).click();
    await expect(page).toHaveURL(/[?&]layout=one(?:&|$)/);
    await expect(page.locator("[data-phone-mode='one']")).toBeVisible();
    await page.getByRole("link", { name: "List", exact: true }).click();
    await expect(page).not.toHaveURL(/layout=one/);
    await expect(page.locator("[data-phone-mode='list']")).toBeVisible();
    return;
  }

  await page.getByRole("link", { name: "One at a time" }).click();
  await expect(page).toHaveURL(/[?&]layout=one(?:&|$)/);
  await expect(page.locator("[data-find-layout='one']")).toBeVisible();
  await page.getByRole("link", { name: "Grid", exact: true }).click();
  await expect(page.locator("[data-find-layout='grid']")).toBeVisible();
});

test("a seeded profile offers native media without JavaScript", async ({ page }) => {
  await page.goto(`/t/${ada.id}`);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: ada.name })).toBeVisible();

  // Phone and desktop heroes both sit in the document. One is hidden by CSS.
  const videos = page.locator("video[data-no-js]:visible");
  await expect(videos.first()).toBeVisible();
  const count = await videos.count();
  expect(count).toBeGreaterThanOrEqual(1);
  expect(count).toBeLessThanOrEqual(2);
  for (const video of await videos.all()) {
    await expect(video).toHaveAttribute("preload", "none");
    expect(await video.evaluate((node) => node.hasAttribute("controls"))).toBe(true);
    const src = await video.getAttribute("src");
    expect(src).toContain("/videos/");
    expect(src).toContain(ada.id);
    expect(src).not.toContain("#t=");
  }
});
