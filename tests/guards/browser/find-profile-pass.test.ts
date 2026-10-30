// Christine 2026-10-23. Find detail, phone card, and profile.
// Runs at 390 and 1280 on Chromium, and again on Firefox and WebKit.
import { expect, test, type Locator, type Page } from "@playwright/test";
import { ada } from "../../../scripts/seed-test/fixtures.mjs";

async function box(locator: Locator) {
  const next = await locator.boundingBox();
  expect(next).not.toBeNull();
  return next!;
}

async function openDesktopDetail(page: Page) {
  await page.goto("/find?layout=one");
  const cardMedia = page.locator('[data-find-card="one"] .aspect-\\[4\\/5\\]').first();
  await expect(cardMedia).toBeVisible();
  const cardBox = await box(cardMedia);
  expect(cardBox.height).toBeGreaterThan(cardBox.width);

  await page
    .locator('[data-find-card="one"]')
    .filter({ hasText: ada.name })
    .getByRole("link", { name: `See ${ada.name}'s profile` })
    .click();
  const detail = page.locator(`[data-find-detail="${ada.id}"]`);
  await expect(detail).toBeVisible();
  return detail;
}

test(
  "desktop find intro is portrait and the profile can show reviews",
  { tag: "@desktop-only" },
  async ({ page }) => {
    const detail = await openDesktopDetail(page);
    const stage = detail.locator("[data-find-stage]");
    await expect(stage).toBeVisible();
    const stageBox = await box(stage);
    const ratio = stageBox.height / stageBox.width;
    expect(ratio).toBeGreaterThan(1.2);
    expect(ratio).toBeLessThan(1.3);

    const still = stage.locator("img");
    await expect(still).toHaveCSS("object-fit", "cover");
    const stillBox = await box(still);
    expect(Math.abs(stillBox.width - stageBox.width)).toBeLessThan(2);
    expect(Math.abs(stillBox.height - stageBox.height)).toBeLessThan(2);

    const credential = detail.locator("p", { hasText: "Licensed psychologist" });
    await expect(credential).toHaveCount(1);
    const line = await credential.innerText();
    expect(line.match(/Licensed psychologist/gi)).toHaveLength(1);

    await detail.getByRole("button", { name: /^Reviews/ }).click();
    await expect(detail.getByText("No reviews yet.")).toBeVisible();
    await detail.getByRole("button", { name: "Profile", exact: true }).click();

    await stage.getByRole("button", { name: "Watch intro" }).click();
    const video = stage.locator("video[data-frame-video]");
    await expect(video).toHaveAttribute("data-frame-video", "ready");
    await expect(video).toHaveCSS("object-fit", "cover");
    const videoBox = await box(video);
    expect(videoBox.width).toBeLessThanOrEqual(stageBox.width + 1);
    expect(videoBox.height).toBeLessThanOrEqual(stageBox.height + 1);
    expect(videoBox.width).toBeGreaterThan(stageBox.width * 0.98);
    expect(videoBox.height).toBeGreaterThan(stageBox.height * 0.98);

    const play = page.locator(
      `[data-find-card="phone"] button[aria-label="Play intro video for ${ada.name}"]`,
    );
    await expect(play).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");

    await page.goto(`/t/${ada.id}`);
    const desk = page.locator("[data-profile-layout='one']");
    const hero = desk.locator("[data-find-stage]");
    const heroBox = await box(hero);
    expect(heroBox.height).toBeGreaterThan(heroBox.width);
    const profileRatio = heroBox.height / heroBox.width;
    expect(profileRatio).toBeGreaterThan(1.2);
    expect(profileRatio).toBeLessThan(1.3);
    await expect(hero.locator("img")).toHaveCSS("object-fit", "cover");
    await expect(desk.locator("[data-session-format]")).toContainText("Online");
    await expect(desk.locator("[data-session-format]")).not.toContainText("Virtual");
    await desk.getByRole("button", { name: /^Reviews/ }).click();
    await expect(desk.getByText("No reviews yet.")).toBeVisible();
  },
);

test(
  "phone find play control is clear and the profile says Online",
  { tag: "@phone-only" },
  async ({ page }) => {
    await page.goto("/find");
    const card = page.locator("[data-find-card='phone']").filter({ hasText: ada.name });
    const frame = card.locator(".aspect-\\[4\\/5\\]");
    const play = card.getByRole("button", {
      name: `Play intro video for ${ada.name}`,
    });
    await expect(play).toBeVisible();
    await expect(play).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(play).toHaveCSS("border-top-style", "solid");
    const frameBox = await box(frame);
    expect(frameBox.height / frameBox.width).toBeGreaterThan(1.2);
    const playBox = await box(play);
    expect(playBox.y).toBeGreaterThan(frameBox.y);
    expect(playBox.y + playBox.height).toBeLessThan(frameBox.y + frameBox.height);
    await expect(card).toContainText("PsyD · Licensed psychologist");
    expect(
      (await card.innerText()).match(/Licensed psychologist/gi),
    ).toHaveLength(1);

    await play.click();
    // The name lives on the frame overlay, which unmounts while the intro plays.
    const video = page.locator("[data-find-card='phone'] video[data-frame-video]");
    await expect(video).toHaveCount(1);
    await expect(video).toHaveAttribute("data-frame-video", "ready");
    await expect(video).toHaveCSS("object-fit", "cover");
    const videoBox = await box(video);
    expect(Math.abs(videoBox.width - frameBox.width)).toBeLessThan(2);
    expect(Math.abs(videoBox.height - frameBox.height)).toBeLessThan(2);

    await page.goto(`/t/${ada.id}`);
    const phone = page.locator("[data-profile-layout='one']");
    await expect(phone.locator("[data-session-format]")).toContainText("Online");
    await expect(phone.locator("[data-session-format]")).not.toContainText("Virtual");
    const hero = phone.locator("[data-find-stage]");
    const heroBox = await box(hero);
    expect(heroBox.height).toBeGreaterThan(heroBox.width);
    const ratio = heroBox.height / heroBox.width;
    expect(ratio).toBeGreaterThan(1.2);
    expect(ratio).toBeLessThan(1.3);
    await phone.getByRole("button", { name: /^Reviews/ }).click();
    await expect(phone.getByText("No reviews yet.")).toBeVisible();
  },
);
