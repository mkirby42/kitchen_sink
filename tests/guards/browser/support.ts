import { expect, type Page, type TestInfo } from "@playwright/test";
import { PASSWORD } from "../../../scripts/seed-test/fixtures.mjs";

/** Chromium calls the phone project `phone`. Firefox and WebKit use `firefox-phone` / `webkit-phone`. */
export function isPhoneProject(testInfo: TestInfo) {
  return testInfo.project.name === "phone" || testInfo.project.name.endsWith("-phone");
}

/**
 * Fresh auth screens must not paint the #137 banner, including after hydration.
 * Next.js adds an empty route announcer (`#__next-route-announcer__`, role=alert)
 * inside a shadow root once client JS runs. That node is not an error banner.
 */
export async function expectQuietAuth(page: Page) {
  await expectNoErrorBanner(page);
  await page.evaluate(
    () => new Promise((resolve) => setTimeout(resolve, 750)),
  );
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

export const TOPICS = [
  "Feeling down or stuck",
  "Worry, stress or panic",
  "Something hard happened",
  "Losing someone",
  "Relationship trouble",
  "Big life changes",
  "Trouble focusing",
];

/** Signed-in owner. The site header hides on /join once the session lands. */
export async function signIn(page: Page, email: string) {
  await page.goto("/join?mode=signin");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in →" }).click();
  await expect(page.getByRole("link", { name: "Therapist log in" })).toHaveCount(0);
}
