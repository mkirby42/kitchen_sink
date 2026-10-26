// Product-decision guard. Do not weaken this file to make CI pass.
// Registry: "The homepage is the therapist start plus the find card"
// Registry: "Homepage does not promote the Beehiiv newsletter"
// Registry: "The header has no Why Kitchen Sink? link"
// Registry: "Header links match who is signed in"
import { expect, test } from "@playwright/test";

const STORY = "https://everythingbutkitchensink.beehiiv.com/p/let-s-connect";

test("The homepage is the therapist start plus the find card", async ({ page }, testInfo) => {
  expect(testInfo.title).toBe(
    "The homepage is the therapist start plus the find card",
  );
  await page.goto("/");
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toContainText("Bring everything.");
  await expect(heading).toContainText("kitchen sink.");
  await expect(page.getByText("FOR THERAPISTS · FREE")).toBeVisible();
  await expect(page.getByRole("link", { name: "Get my profile started" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Build it myself from scratch" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Find a therapist who Gets You." }),
  ).toBeVisible();
  await expect(page.getByText("Meet clients who are ready to bring it all.")).toHaveCount(0);
  await expect(page.getByText("actually fits")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Uploads" })).toHaveCount(0);
});

test("Homepage does not promote the Beehiiv newsletter", async ({ page }, testInfo) => {
  expect(testInfo.title).toBe("Homepage does not promote the Beehiiv newsletter");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Why Kitchen Sink\?/ })).toHaveCount(0);
  await expect(page.getByText("From the newsletter")).toHaveCount(0);
  await expect(page.getByText("The story behind the name and our Why.")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Read the story/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Subscribe to the newsletter" })).toHaveCount(0);
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Why Kitchen Sink?" }),
  ).toHaveCount(0);
  await expect(page.getByRole("banner").locator(`a[href="${STORY}"]`)).toHaveCount(0);
  const headerTargets = await page.getByRole("banner").locator("a").evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("target") ?? ""),
  );
  expect(headerTargets).not.toContain("_blank");
});

test("Header links match who is signed in", async ({ page }, testInfo) => {
  expect(testInfo.title).toBe("Header links match who is signed in");
  await page.goto("/");
  const header = page.getByRole("banner");
  for (const name of [
    "Home",
    "Find a Therapist",
    "For Therapists",
    "Therapist log in",
  ]) {
    await expect(header.getByRole("link", { name, exact: true })).toBeVisible();
  }
  await expect(header.getByRole("link", { name: "For Therapists", exact: true })).toHaveAttribute(
    "href",
    "/for-therapists",
  );
  await expect(header.getByRole("link", { name: "Therapist log in", exact: true })).toHaveAttribute(
    "href",
    "/join?mode=signin",
  );
  await expect(header.getByRole("link", { name: "Why Kitchen Sink?", exact: true })).toHaveCount(0);
  await expect(header.getByRole("link", { name: "Referrals", exact: true })).toHaveCount(0);
  await expect(header.getByRole("link", { name: "My profile", exact: true })).toHaveCount(0);
  await expect(header.getByRole("button", { name: "Sign out", exact: true })).toHaveCount(0);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(true);
});
