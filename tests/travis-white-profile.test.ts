import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { MAYA_ID } from "@/lib/therapists/ids";
import { travisMedia, travisWhite } from "../scripts/travis-white/profile.mjs";
import { buildApplySql } from "../scripts/travis-white/sql.mjs";

const PHOTO_MAX = 5 * 1024 * 1024;
const VIDEO_MAX = 50 * 1024 * 1024;
const removal = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260925043000_finish_demo_profile_removal.sql",
  ),
  "utf8",
);

describe("Travis White profile", () => {
  const sql = buildApplySql();

  it("is a real login, outside the demo wipe", () => {
    expect(travisWhite.email.endsWith("@kitchensink.demo")).toBe(false);
    expect(travisWhite.email).toBe("thetalkshoppeatx@gmail.com");
    expect(removal).not.toContain(travisWhite.email);
    expect(removal).not.toContain("Travis White");
    expect(sql).not.toContain(MAYA_ID);
    expect(sql).not.toContain("encrypted_password =");
    expect(sql).toContain("role");
    expect(sql).toContain("'therapist'");
  });

  it("is listed and open, with the published license and rate", () => {
    expect(travisWhite.listed).toBe(true);
    expect(travisWhite.openToNewClients).toBe(true);
    expect(travisWhite.virtual).toBe(true);
    expect(travisWhite.inPerson).toBe(true);
    expect(travisWhite.credential).toBe("PsyD");
    expect(travisWhite.startDate).toBeNull();
    expect(travisWhite.slidingScale).toBe(false);
    expect(travisWhite.superbill).toBe(true);
    expect(travisWhite.licenses).toEqual([{ number: "38047", state: "TX" }]);
    expect(travisWhite.rates).toEqual([
      { service_type: "Individual", duration_minutes: 55, price_cents: 15000 },
    ]);
    expect(travisWhite.cards.length).toBeGreaterThanOrEqual(3);
    expect(travisWhite.cards.length).toBeLessThanOrEqual(6);
    expect(sql).toContain("38047");
    expect(sql).toContain("15000");
  });

  it("ships a photo and the full intro video under the bucket limits", () => {
    const photo = statSync(resolve(process.cwd(), travisMedia.photoPath));
    const video = statSync(resolve(process.cwd(), travisMedia.videoPath));
    expect(photo.size).toBeGreaterThan(10_000);
    expect(photo.size).toBeLessThanOrEqual(PHOTO_MAX);
    expect(video.size).toBeGreaterThan(1_000_000);
    expect(video.size).toBeLessThanOrEqual(VIDEO_MAX);
    const header = readFileSync(
      resolve(process.cwd(), travisMedia.photoPath),
    ).subarray(0, 3);
    expect([...header]).toEqual([0xff, 0xd8, 0xff]);
  });
});
