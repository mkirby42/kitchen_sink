import { expect, type Page } from "@playwright/test";
import { PASSWORD } from "../../../scripts/seed-test/fixtures.mjs";

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
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("link", { name: "Therapist log in" })).toHaveCount(0);
}
