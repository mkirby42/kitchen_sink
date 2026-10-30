// Product-decision guard. Do not weaken this file to make CI pass.
// Registry: "The public profile uses the Find detail frame"
// Registry: "Profile sections follow the Find detail, on the phone and on desktop"
// Registry: "Book and Free consult open a contact sheet"
// Registry: "A closed practice says Not accepting new clients"
// Registry: "The owner can Edit and Delete from the profile"
import { expect, test } from "@playwright/test";
import {
  OFFICE_STREET,
  PRICE_LABEL,
  VOICE_TITLE,
  ada,
  bea,
  closed,
} from "../../../scripts/seed-test/fixtures.mjs";
import { signIn } from "./support";

const PROFILE_ORDER = [
  "How Ada works",
  "Areas of interest",
  "Approach in therapy",
  "In Ada's own words",
];

test(
  "The public profile uses the Find detail frame",
  async ({ page }, testInfo) => {
    expect(testInfo.title).toBe("The public profile uses the Find detail frame");
    await page.goto(`/t/${ada.id}`);
    await expect(page.getByText("1 min intro")).toHaveCount(0);
    const layout = page.locator("[data-profile-layout='one']");
    const stage = layout.locator("[data-find-stage]");
    await expect(stage).toBeVisible();
    const still = stage.locator("img");
    await expect(still).toHaveCount(1);
    await expect(still).toHaveCSS("object-fit", "cover");
    await expect(stage.getByRole("button", { name: "Watch intro" })).toBeVisible();
    await expect(layout.locator("[data-profile-photo]")).toHaveCount(0);
    await expect(layout.getByRole("heading", { name: ada.name })).toBeVisible();
    await expect(layout).toContainText("PsyD");
    await expect(layout).toContainText(/Licensed in Texas/);
    const placed = await layout.evaluate((root) => {
      const shot = root.querySelector("[data-find-stage]");
      const how = [...root.querySelectorAll("h2")].find((node) =>
        node.textContent?.includes("How "),
      );
      if (!shot || !how) return false;
      return Boolean(shot.compareDocumentPosition(how) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(placed).toBe(true);
  },
);

test(
  "Profile sections follow the Find detail, on the phone and on desktop",
  async ({ page }, testInfo) => {
    expect(testInfo.title).toBe(
      "Profile sections follow the Find detail, on the phone and on desktop",
    );
    await page.goto(`/t/${ada.id}`);
    const phone = page.locator("[data-profile-layout='one']");
    const text = (await phone.getByRole("heading").allTextContents()).join("\n");
    let previous = -1;
    for (const heading of PROFILE_ORDER) {
      expect(text).toContain(heading);
      const index = text.indexOf(heading);
      expect(index).toBeGreaterThan(previous);
      previous = index;
    }
    await expect(phone.getByText("Cognitive behavioral therapy (CBT)")).toBeVisible();
    await expect(phone.getByRole("heading", { name: "Education" })).toHaveCount(0);
    await expect(phone.getByRole("heading", { name: "Identity" })).toHaveCount(0);
    await expect(phone.getByText("Sample State University")).toBeVisible();
    const body = await phone.innerText();
    const licenseAt = body.indexOf("Licensed in Texas");
    const schoolAt = body.indexOf("Sample State University");
    const insuranceAt = body.indexOf("Aetna");
    expect(licenseAt).toBeGreaterThan(-1);
    expect(schoolAt).toBeGreaterThan(licenseAt);
    expect(insuranceAt).toBeGreaterThan(schoolAt);
    const stage = phone.locator("[data-find-stage] img");
    await expect(stage).toBeVisible();
    await expect(stage).toHaveCSS("object-fit", "cover");
    const placed = await phone.evaluate((root) => {
      const shot = root.querySelector("[data-find-stage]");
      const how = [...root.querySelectorAll("h2")].find((node) =>
        node.textContent?.includes("How Ada works"),
      );
      const words = [...root.querySelectorAll("h2")].find((node) =>
        node.textContent?.includes("own words"),
      );
      if (!shot || !how || !words) return false;
      const after = Node.DOCUMENT_POSITION_FOLLOWING;
      return (
        Boolean(shot.compareDocumentPosition(how) & after) &&
        Boolean(how.compareDocumentPosition(words) & after)
      );
    });
    expect(placed).toBe(true);
    await expect(phone.getByText(OFFICE_STREET)).toBeVisible();
    await expect(phone.getByText(PRICE_LABEL)).toBeVisible();
    await expect(phone.getByText("Sliding scale")).toBeVisible();
    await expect(phone.getByText("Available")).toBeVisible();
    await expect(phone.getByText("Aetna")).toBeVisible();
    const wide = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    );
    expect(wide).toBe(true);
  },
);

test(
  "Book and Free consult open a contact sheet",
  { tag: "@phone-only" },
  async ({ page }, testInfo) => {
    expect(testInfo.title).toBe("Book and Free consult open a contact sheet");
    await page.goto(`/t/${ada.id}`);
    const dock = page.locator("[data-cta-placement='dock']");
    await expect(dock).toBeVisible();
    await expect(dock).toHaveCSS("position", "fixed");
    const book = dock.getByRole("button", { name: "Book a session" });
    const consult = dock.getByRole("button", { name: "Free consult" });
    await expect(book).toBeVisible();
    await expect(consult).toBeVisible();
    const consultBox = await consult.boundingBox();
    const bookBox = await book.boundingBox();
    expect(consultBox).not.toBeNull();
    expect(bookBox).not.toBeNull();
    expect(consultBox!.x).toBeLessThan(bookBox!.x);
    await consult.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Reach Ada" })).toBeVisible();
    await expect(dialog).toContainText("doesn't book sessions");
    await expect(dialog.getByRole("link", { name: /Email/ })).toHaveAttribute("href", /^mailto:/);
    await expect(dialog.getByRole("link", { name: /Call/ })).toHaveAttribute("href", /^tel:/);
    await expect(dialog.getByRole("link", { name: /Text/ })).toHaveAttribute("href", /^sms:/);
    await expect(book).not.toHaveAttribute("href", /.+/);
  },
);

test(
  "A closed practice says Not accepting new clients",
  async ({ page }, testInfo) => {
    expect(testInfo.title).toBe("A closed practice says Not accepting new clients");
    await page.goto(`/t/${ada.id}`);
    await expect(page.getByText("Not accepting new clients")).toHaveCount(0);
    await page.goto(`/t/${closed.id}`);
    await expect(page.getByText("We couldn't find that therapist.")).toBeVisible();
    await expect(page.getByText("Not accepting new clients")).toHaveCount(0);
    await signIn(page, closed.email);
    await page.goto(`/t/${closed.id}`);
    const layout = page.locator("[data-profile-layout='one']");
    await expect(layout.getByText("Not accepting new clients")).toBeVisible();
    await expect(layout.getByRole("heading", { name: closed.name })).toBeVisible();
  },
);

test("The owner can Edit and Delete from the profile", async ({ page }, testInfo) => {
  expect(testInfo.title).toBe("The owner can Edit and Delete from the profile");
  await page.goto(`/t/${ada.id}`);
  await expect(page.getByRole("link", { name: "Edit profile" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Delete profile" })).toHaveCount(0);
  await signIn(page, ada.email);
  await page.goto(`/t/${ada.id}`);
  await expect(page.getByRole("link", { name: "Back to search" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Edit profile" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete profile" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Referrals" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Therapist log in" })).toHaveCount(0);
});

test(
  "A voice prompt shows on the profile and not on Find",
  { tag: "@desktop-only" },
  async ({ page }, testInfo) => {
    expect(testInfo.title).toBe(
      "A voice prompt shows on the profile and not on Find",
    );
    await page.goto("/find");
    const card = page.locator('[data-find-card="grid"]').filter({ hasText: bea.name });
    await expect(card).not.toContainText(VOICE_TITLE);
    await expect(
      card.getByRole("button", { name: `Play intro video for ${bea.name}` }),
    ).toHaveCount(0);
    await page.goto(`/t/${bea.id}`);
    const desk = page.locator("[data-profile-layout='one']");
    await expect(desk.getByText(VOICE_TITLE)).toBeVisible();
    const stack = desk.locator("[data-cta-placement='inline']");
    const consult = stack.getByRole("button", { name: "Free consult" });
    const book = stack.getByRole("button", { name: "Book a session" });
    const consultBox = await consult.boundingBox();
    const bookBox = await book.boundingBox();
    expect(consultBox).not.toBeNull();
    expect(bookBox).not.toBeNull();
    expect(consultBox!.x).toBeLessThan(bookBox!.x);
    await expect(desk.getByRole("button", { name: "Watch Bea's intro" })).toHaveCount(0);
  },
);
