// Product-decision guard. Do not weaken this file to make CI pass.
// Registry: "Opening a desktop card stays on Find"
import { expect, test } from "@playwright/test";
import {
  OFFICE_STREET,
  PRICE_LABEL,
  WORK_ANSWER,
  ada,
} from "../../../scripts/seed-test/fixtures.mjs";

test(
  "Opening a desktop card stays on Find",
  { tag: "@desktop-only" },
  async ({ page }, testInfo) => {
    expect(testInfo.title).toBe("Opening a desktop card stays on Find");
    await page.goto("/find");
    await page
      .locator('[data-find-card="grid"]')
      .filter({ hasText: ada.name })
      .getByRole("link", { name: `See ${ada.name}'s profile` })
      .click();
    await expect(page).toHaveURL(new RegExp(`/find\\?.*t=${ada.id}`));
    const detail = page.locator(`[data-find-detail="${ada.id}"]`);
    await expect(detail.getByRole("heading", { name: ada.name })).toBeVisible();
    await expect(detail.getByRole("button", { name: "Watch intro" })).toBeVisible();
    await expect(detail.getByText(WORK_ANSWER)).toBeVisible();
    await expect(detail.getByText("Cognitive behavioral therapy (CBT)")).toBeVisible();
    await expect(detail.getByText(OFFICE_STREET)).toBeVisible();
    await expect(detail.getByText(PRICE_LABEL)).toBeVisible();
    await expect(detail.getByText("Available")).toBeVisible();
    await expect(page.getByRole("link", { name: "All matches" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Next therapist", exact: true })).toHaveCount(2);

    const consult = page.getByRole("button", { name: "Book a free 15-min consult" });
    await expect(consult).toBeVisible();
    await expect(page.getByRole("button", { name: "Book a session" })).toBeVisible();
    await consult.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Reach Ada" })).toBeVisible();
    await expect(dialog).toContainText("doesn't book sessions");
    await expect(dialog.getByRole("link", { name: /Email/ })).toHaveAttribute(
      "href",
      `mailto:${ada.email}`,
    );
    await expect(dialog.getByRole("link", { name: /Call/ })).toHaveAttribute(
      "href",
      /^tel:/,
    );
    await expect(dialog.getByRole("link", { name: /Text/ })).toHaveAttribute(
      "href",
      /^sms:/,
    );

    await page.getByRole("button", { name: "Close" }).click();
    await page.getByRole("link", { name: "All matches" }).click();
    await expect(page).not.toHaveURL(/[?&]t=/);
    await expect(page.locator('[data-find-layout="grid"]')).toBeVisible();
  },
);
