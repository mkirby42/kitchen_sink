import { randomUUID } from "node:crypto";
import path from "node:path";
import { expect, test } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DRAFT_PROFILE_LABEL,
  NOT_ACCEPTING_CLIENTS_LABEL,
} from "../../../lib/therapists/listing";
import { createTestServiceClient, deleteAuthUser } from "../../test-supabase";

const media = path.join(process.cwd(), "scripts/seed-test/placeholders");

/**
 * Closed to new clients so the row stays off Find while it is published.
 * Find guards assert the seeded open set (counts, Ada, Cora, order). The
 * owner can still open /t/{id}. A new auth user per run keeps phone and
 * desktop workers from sharing a row. Uploads stay on Chromium; Firefox and
 * WebKit are not in this file's project list.
 */
async function removePracticeMedia(service: SupabaseClient, userId: string) {
  for (const bucket of ["photos", "videos", "voice"] as const) {
    const listed = await service.storage.from(bucket).list(userId);
    if (listed.error) throw new Error(`${bucket}: ${listed.error.message}`);
    const names = (listed.data ?? []).map((file) => `${userId}/${file.name}`);
    if (names.length === 0) continue;
    const removed = await service.storage.from(bucket).remove(names);
    if (removed.error) throw new Error(`${bucket}: ${removed.error.message}`);
  }
}

test(
  "a throwaway therapist saves a draft, publishes, and edits",
  { tag: "@chromium-only" },
  async ({ page }) => {
    test.setTimeout(180_000);
    const email = `builder-${randomUUID()}@gmail.com`;
    const password = `Builder-${randomUUID()}Aa1`;
    const name = `Builder ${randomUUID().slice(0, 8)}`;
    const renamed = `${name} Updated`;
    const service = createTestServiceClient();
    let userId: string | null = null;

    try {
      const created = await service.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (created.error || !created.data.user) {
        throw new Error(created.error?.message ?? "admin createUser returned no user");
      }
      userId = created.data.user.id;

      await page.goto("/join?mode=signin");
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password").fill(password);
      await page.getByRole("button", { name: "Sign in →" }).click();
      await expect(page.getByText("Step 1 of 4")).toBeVisible();

      await page.getByLabel("Full name").fill(name);
      await page.getByLabel("Credential").selectOption("PsyD");
      await page.getByLabel("Years practicing").fill("5");
      await page.getByLabel("License 1 number").fill("38047");
      await page.getByLabel("License 1 state").selectOption("TX");
      await page.getByRole("button", { name: "Continue →" }).click();
      await expect(page.getByText("Step 2 of 4")).toBeVisible();

      await page.getByLabel("Choose a photo").setInputFiles(path.join(media, "photo.jpg"));
      await expect(page.getByText("Photo uploaded")).toBeVisible({ timeout: 30_000 });
      await page.getByLabel("Choose a video").setInputFiles(path.join(media, "intro.mp4"));
      await expect(page.getByText("Video uploaded")).toBeVisible({ timeout: 30_000 });
      await page.getByRole("button", { name: "Continue →" }).click();
      await expect(page.getByText("Step 3 of 4")).toBeVisible();

      const accepting = page.getByRole("switch", {
        name: "Currently accepting new clients",
      });
      await expect(accepting).toHaveAttribute("aria-checked", "true");
      await accepting.click();
      await expect(accepting).toHaveAttribute("aria-checked", "false");
      await page.getByRole("button", { name: "Online", exact: true }).click();
      await page.getByRole("button", { name: "Anxiety", exact: true }).click();
      await page.getByRole("button", { name: "Continue →" }).click();
      await expect(page.getByText("Step 4 of 4")).toBeVisible();

      await page.getByLabel("Rate 1 price in dollars").fill("150");
      for (const prompt of [
        "my approach to therapy is...",
        "a session with me feels like...",
        "I enjoy working with people who...",
      ]) {
        await page.getByRole("button", { name: prompt }).click();
      }
      const answers = page.getByPlaceholder("Write 1–2 sentences in your own voice…");
      await expect(answers).toHaveCount(3);
      await answers.nth(0).fill("Practical and direct.");
      await answers.nth(1).fill("Unhurried.");
      await answers.nth(2).fill("Adults who want a clear plan.");
      await expect(page.getByLabel("Email")).toHaveValue(email);

      await page.getByRole("button", { name: "Save as draft" }).click();
      await expect(page).toHaveURL(new RegExp(`/t/${userId}`), { timeout: 30_000 });
      await expect(
        page.getByRole("heading", { name, exact: true }).filter({ visible: true }),
      ).toBeVisible();
      await expect(page.getByText(DRAFT_PROFILE_LABEL).filter({ visible: true })).toBeVisible();

      await page.getByRole("link", { name: "Edit profile" }).click();
      await expect(page.getByText("Step 1 of 4")).toBeVisible();
      for (const step of [2, 3, 4]) {
        await page.getByRole("button", { name: "Continue →" }).click();
        await expect(page.getByText(`Step ${step} of 4`)).toBeVisible();
      }
      await page.getByRole("button", { name: "Publish profile →" }).click();
      await expect(page).toHaveURL(new RegExp(`/t/${userId}`), { timeout: 30_000 });
      await expect(
        page.getByRole("heading", { name, exact: true }).filter({ visible: true }),
      ).toBeVisible();
      await expect(page.getByText(DRAFT_PROFILE_LABEL)).toHaveCount(0);
      await expect(
        page.getByText(NOT_ACCEPTING_CLIENTS_LABEL).filter({ visible: true }),
      ).toBeVisible();

      await page.goto("/find");
      await expect(page.getByText(name)).toHaveCount(0);

      await page.goto(`/t/${userId}`);
      await page.getByRole("link", { name: "Edit profile" }).click();
      await expect(page.getByText("Step 1 of 4")).toBeVisible();
      await page.getByLabel("Full name").fill(renamed);
      for (const step of [2, 3, 4]) {
        await page.getByRole("button", { name: "Continue →" }).click();
        await expect(page.getByText(`Step ${step} of 4`)).toBeVisible();
      }
      await page.getByRole("button", { name: "Save changes →" }).click();
      await expect(page).toHaveURL(new RegExp(`/t/${userId}`), { timeout: 30_000 });
      await expect(
        page.getByRole("heading", { name: renamed, exact: true }).filter({ visible: true }),
      ).toBeVisible();
    } finally {
      if (userId) {
        await removePracticeMedia(service, userId);
        await deleteAuthUser(service, userId);
      }
    }
  },
);
