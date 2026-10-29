import { defineConfig, devices } from "@playwright/test";

const port = 3000;
const baseURL = `http://127.0.0.1:${port}`;

/**
 * Christine path: the pages a visitor or therapist hits before a profile
 * exists. Chromium phone and desktop still run every file under
 * tests/guards/browser. Firefox and WebKit run only this list.
 *
 * No join/edit builder browser test exists. A save or publish on a seeded
 * account would collide across projects, so that flow is not in this matrix.
 * Profile tests sign in as seeded users and do not save or publish, so they
 * stay in the list. The no-JS sign-up posts an already-confirmed throwaway
 * user and accepts either "already registered" or the confirm-email screen.
 * It runs on Firefox and WebKit too. The forgot-password request sends Auth
 * mail and stays @chromium-only: hosted test Auth's built-in email is about 2/hour.
 * Reset-password without JavaScript uses admin generateLink and sends no email,
 * so it runs on Chromium, Firefox, and WebKit desktop.
 *
 * CI's e2e job uses mcr.microsoft.com/playwright:v1.64.1-jammy, which already
 * ships Chromium, Firefox, and WebKit. No browser install step there.
 */
const christinePath = [
  "**/home-nav.test.ts",
  "**/join-signup-auth.test.ts",
  "**/join-auth-no-js.test.ts",
  "**/reset-password-no-js.test.ts",
  "**/auth-clean-load.test.ts",
  "**/find-cards.test.ts",
  "**/find-detail.test.ts",
  "**/find-filters.test.ts",
  "**/phone-find.test.ts",
  "**/find-profile-pass.test.ts",
  "**/profile.test.ts",
];

export default defineConfig({
  testDir: "tests/guards/browser",
  testMatch: "**/*.test.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  // Mostly read-only against the shared test project. Email submits stay on
  // one Chromium project so extra workers do not multiply those calls.
  workers: process.env.CI ? 3 : undefined,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }]]
    : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
  },
  projects: [
    {
      name: "phone",
      grepInvert: /@desktop-only/,
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "desktop",
      grepInvert: /@phone-only/,
      use: { viewport: { width: 1280, height: 900 } },
    },
    {
      name: "firefox-phone",
      testMatch: christinePath,
      grepInvert: /@desktop-only|@chromium-only/,
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "firefox-desktop",
      testMatch: christinePath,
      grepInvert: /@phone-only|@chromium-only/,
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 1280, height: 900 },
      },
    },
    {
      name: "webkit-phone",
      testMatch: christinePath,
      grepInvert: /@desktop-only|@chromium-only/,
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "webkit-desktop",
      testMatch: christinePath,
      grepInvert: /@phone-only|@chromium-only/,
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1280, height: 900 },
      },
    },
  ],
  webServer: {
    command: `npm run start -- --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
