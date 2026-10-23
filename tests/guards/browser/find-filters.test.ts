// Product-decision guard. Do not weaken this file to make CI pass.
// Registry: "Find filters are four pills, and the phone row wraps"
// Registry: "What's going on is seven plain-language topics"
import { expect, test } from "@playwright/test";
import { TOPICS } from "./support";

const PILLS = "Where you live|Insurance|What's going on|In person or online";

test("Find filters are four pills, and the phone row wraps", async ({ page }, testInfo) => {
  expect(testInfo.title).toBe(
    "Find filters are four pills, and the phone row wraps",
  );
  await page.goto("/find");
  await expect(page.getByRole("heading", { name: "Find your therapist" })).toBeVisible();

  if (testInfo.project.name === "phone") {
    const labels = await page.locator("[data-phone-pill]").allTextContents();
    expect(labels.map((label) => label.trim()).join("|")).toBe(PILLS);
    const row = await page.locator("[data-phone-pills]").boundingBox();
    expect(row?.width ?? 999).toBeLessThanOrEqual(390);
    for (const pill of await page.locator("[data-phone-pill]").all()) {
      const box = await pill.boundingBox();
      expect(box).not.toBeNull();
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(391);
    }
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    );
    expect(overflow).toBe(true);
  } else {
    const text = await page.locator('[data-find-desktop="filters"]').innerText();
    expect(text).toContain("Where you live");
    expect(text).toContain("Insurance");
    expect(text).toContain("What's going on");
    expect(text).toContain("In person or online");
    expect(text.indexOf("Where you live")).toBeLessThan(text.indexOf("Insurance"));
    expect(text.indexOf("Insurance")).toBeLessThan(text.indexOf("What's going on"));
    expect(text.indexOf("What's going on")).toBeLessThan(
      text.indexOf("In person or online"),
    );
  }

  await expect(page.getByText("Years in practice")).toHaveCount(0);
  await expect(page.getByText("What brings you to therapy?")).toHaveCount(0);
});

test("What's going on is seven plain-language topics", async ({ page }, testInfo) => {
  expect(testInfo.title).toBe(
    "What's going on is seven plain-language topics",
  );
  await page.goto("/find");

  if (testInfo.project.name === "phone") {
    await page.getByRole("button", { name: "What's going on" }).click();
    await expect(page.getByRole("button", { name: "Clear all" })).toBeVisible();
  }

  const sheet =
    testInfo.project.name === "phone"
      ? page.locator("[data-phone-sheet='topics']")
      : page.locator("#find-whats-going-on");
  await expect(
    sheet.getByRole("heading", { name: "What would you like help with?" }),
  ).toBeVisible();
  const text = await sheet.innerText();
  expect(text).toContain("You don't need the clinical");
  expect(text).toContain("it's in small print");
  for (const topic of TOPICS) expect(text).toContain(topic);
  expect(text).toContain("Depression");
  expect(text).toContain("Anxiety, panic disorder");
  expect(text).toContain("Trauma, PTSD");
  expect(text).toContain("ADHD");
  expect(text).toMatch(/Show \d+ therapists/);
  expect(text).not.toContain("Self Discovery");
  expect(text).not.toContain("Self discovery");
  expect(text).not.toContain("Immigration");
  expect(text).not.toContain("Family or parenting");
  expect(text).not.toContain("Burnout or work stress");
  expect(text).not.toContain("What brings you to therapy?");
});
