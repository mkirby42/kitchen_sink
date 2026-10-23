// Product-decision guard. Do not weaken this file to make CI pass.
// Registry: "Desktop Find is a grid of eight"
// Registry: "A Find card has no price, no specialty pills, and no match count"
// Registry: "One at a time uses that same card"
import { expect, test } from "@playwright/test";
import {
  PRICE_LABEL,
  WORK_ANSWER,
  WORK_PROMPT,
  ada,
  bea,
  ira,
} from "../../../scripts/seed-test/fixtures.mjs";

test(
  "Desktop Find is a grid of eight",
  { tag: "@desktop-only" },
  async ({ page }, testInfo) => {
    expect(testInfo.title).toBe("Desktop Find is a grid of eight");
    await page.goto("/find");
    const results = page.locator("#find-results");
    await expect(results.getByText("9 therapists fit what you told us")).toBeVisible();
    await expect(results.getByText("Click anyone to see their full profile")).toBeVisible();
    await expect(results.locator('[data-find-card="grid"]')).toHaveCount(8);
    await expect(results.getByText(ira.name)).toHaveCount(0);
    await page.getByRole("link", { name: "Show 1 more" }).click();
    await expect(page).toHaveURL(/more=1/);
    await expect(results.locator('[data-find-card="grid"]')).toHaveCount(9);
    await expect(results.getByText(ira.name)).toBeVisible();
    await expect(page.getByRole("link", { name: /Show \d+ more/ })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Grid" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.getByRole("link", { name: "One at a time" })).toBeVisible();
  },
);

test(
  "A Find card has no price, no specialty pills, and no match count",
  { tag: "@desktop-only" },
  async ({ page }, testInfo) => {
    expect(testInfo.title).toBe(
      "A Find card has no price, no specialty pills, and no match count",
    );
    await page.goto("/find");
    const card = page.locator('[data-find-card="grid"]').filter({ hasText: ada.name });
    const text = await card.innerText();
    expect(text).toContain(ada.name);
    expect(text).toContain("In person · Online");
    expect(text).toContain("PsyD · Licensed psychologist");
    expect(text).toContain(WORK_PROMPT);
    expect(text).toContain(WORK_ANSWER);
    expect(text).toContain("Takes Aetna");
    expect(text).toMatch(/\d+ yrs in practice/);
    expect(text).not.toContain(PRICE_LABEL);
    expect(text).not.toContain("Sliding");
    expect(text).not.toContain("Available");
    expect(text).not.toContain("Anxiety");
    expect(text).not.toContain("tags");
    await expect(
      card.getByRole("button", { name: `Play intro video for ${ada.name}` }),
    ).toBeVisible();
  },
);

test(
  "One at a time uses that same card",
  { tag: "@desktop-only" },
  async ({ page }, testInfo) => {
    expect(testInfo.title).toBe("One at a time uses that same card");
    await page.goto("/find?layout=one");
    await expect(
      page.getByText("Therapist 1 of 9 who fit what you told us"),
    ).toBeVisible();
    const card = page.locator('[data-find-card="one"]');
    await expect(card).toHaveCount(9);
    const text = await page.locator("[data-find-layout='one']").innerText();
    expect(text).toContain(ada.name);
    expect(text).toContain("PsyD · Licensed psychologist");
    expect(text).toContain(WORK_PROMPT);
    expect(text).toContain("Takes Aetna");
    expect(text).not.toContain("Get to know");
    expect(text).not.toContain("Can help with");
    expect(text).not.toContain(PRICE_LABEL);
    await expect(page.locator("[data-find-layout='one'] [inert]")).toHaveCount(8);
    const neighbor = await card.filter({ hasText: bea.name }).boundingBox();
    const frame = await page.locator("[data-find-layout='one'] .overflow-x-auto").boundingBox();
    expect(neighbor).not.toBeNull();
    expect(frame).not.toBeNull();
    expect(neighbor!.x).toBeGreaterThanOrEqual(frame!.x + frame!.width - 1);
    await page.getByRole("link", { name: "Grid", exact: true }).click();
    await expect(page.locator('[data-find-layout="grid"]')).toBeVisible();
  },
);
