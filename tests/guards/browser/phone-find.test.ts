// Product-decision guard. Do not weaken this file to make CI pass.
// Registry: "The phone Find page lists, and can switch to one at a time"
// Registry: "A phone list card with a photo is a tall frame"
// Registry: "Phone one-at-a-time is the profile, with a swipe"
import { expect, test } from "@playwright/test";
import {
  PRICE_LABEL,
  WORK_ANSWER,
  ada,
  bea,
  closed,
  draft,
} from "../../../scripts/seed-test/fixtures.mjs";

test(
  "The phone Find page lists, and can switch to one at a time",
  { tag: "@phone-only" },
  async ({ page }, testInfo) => {
    expect(testInfo.title).toBe(
      "The phone Find page lists, and can switch to one at a time",
    );
    await page.goto("/find");
    await expect(
      page.getByRole("heading", { name: "Find your therapist" }),
    ).toBeVisible();
    await expect(
      page.locator("[data-phone-find]").getByText("9 therapists fit", { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "List" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator("[data-phone-list] [data-find-card='phone']")).toHaveCount(9);
    await expect(page.getByText(draft.name)).toHaveCount(0);
    await expect(page.getByText(closed.name)).toHaveCount(0);
    await page.getByRole("button", { name: "One at a time" }).click();
    await expect(page.locator("[data-phone-stack]")).toBeVisible();
    await expect(page.getByRole("button", { name: "All 9" })).toBeVisible();
  },
);

test(
  "A phone list card with a photo is a tall frame",
  { tag: "@phone-only" },
  async ({ page }, testInfo) => {
    expect(testInfo.title).toBe("A phone list card with a photo is a tall frame");
    await page.goto("/find");
    const card = page.locator("[data-find-card='phone']").filter({ hasText: ada.name });
    const frame = card.locator(".aspect-\\[4\\/5\\]");
    await expect(frame).toBeVisible();
    const box = await frame.boundingBox();
    expect(box).not.toBeNull();
    expect((box?.height ?? 0) / (box?.width ?? 1)).toBeGreaterThan(1.2);
    expect((box?.height ?? 0) / (box?.width ?? 1)).toBeLessThan(1.3);
    const text = await card.innerText();
    expect(text).toContain("In person · Online");
    expect(text).toContain(ada.name);
    expect(text).toContain("PsyD · Licensed psychologist");
    expect(text).toContain("I work best with...");
    expect(text).toContain(WORK_ANSWER);
    expect(text).not.toContain(PRICE_LABEL);
    expect(text).not.toContain("Takes Aetna");
    expect(text).not.toContain("yrs");
    expect(text).not.toContain("Anxiety");
    expect(text).not.toContain("tags");
    const play = card.getByRole("button", { name: `Play intro video for ${ada.name}` });
    await expect(play).toBeVisible();
    const playBox = await play.boundingBox();
    expect(playBox).not.toBeNull();
    expect(playBox!.y).toBeGreaterThan(box!.y);
    expect(playBox!.y + playBox!.height).toBeLessThan(box!.y + box!.height);
    await card.getByText(ada.name, { exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/t/${ada.id}`));
  },
);

test(
  "Phone one-at-a-time is the profile, with a swipe",
  { tag: "@phone-only" },
  async ({ page }, testInfo) => {
    expect(testInfo.title).toBe("Phone one-at-a-time is the profile, with a swipe");
    await page.goto("/find");
    await page.getByRole("button", { name: "One at a time" }).click();
    const stack = page.locator("[data-phone-stack]");
    await expect(stack.locator("[aria-live='polite']")).toContainText("1 of 9");
    await expect(stack.getByText("Swipe for the next therapist")).toBeVisible();
    const next = stack.getByRole("button", { name: "Swipe for 2 of 9" });
    await expect(next).toBeVisible();
    await expect(next).toContainText(bea.name);
    await next.click();
    await expect(stack.locator('[data-phone-slide="active"]')).toContainText(bea.name);
    await expect(stack.locator("[aria-live='polite']")).toContainText("2 of 9");
    await expect(stack.getByText("Swipe for the next therapist")).toHaveCount(0);
    await expect(stack.locator('[data-phone-slide="active"]')).toContainText("How Bea works");
    await expect(stack.locator("[data-cta-placement='dock']")).toBeVisible();
  },
);
