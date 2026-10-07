import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  step1Errors,
  step2Errors,
  step3Errors,
  step4Errors,
} from "@/lib/join/validate";
import type { JoinDraft } from "@/lib/join/types";
import { yearsPracticing } from "@/lib/therapists/display";
import { MAYA_ID } from "@/lib/therapists/ids";
import {
  TRAVIS_PROFILE_ID,
  travisMedia,
  travisWhite,
} from "../scripts/travis-white/profile.mjs";
import { buildApplySql } from "../scripts/travis-white/sql.mjs";

const PHOTO_MAX = 5 * 1024 * 1024;
const VIDEO_MAX = 50 * 1024 * 1024;

function labels(kind: string) {
  return travisWhite.tags
    .filter((tag) => tag.kind === kind)
    .map((tag) => tag.label);
}

function joinDraftFromTravis(): JoinDraft {
  const years = yearsPracticing(travisWhite.startDate);
  return {
    name: travisWhite.name,
    credential: travisWhite.credential,
    yearsPracticing: years ?? "",
    education: travisWhite.qualifications
      .filter((item) => item.kind === "education")
      .map((item) => item.label),
    credentials: travisWhite.qualifications
      .filter((item) => item.kind === "credential")
      .map((item) => item.label),
    licenses: travisWhite.licenses.map((license) => ({
      number: license.number,
      state: license.state,
    })),
    photoKey: `${TRAVIS_PROFILE_ID}/photo.jpg`,
    videoKey: `${TRAVIS_PROFILE_ID}/intro.mp4`,
    openToNewClients: travisWhite.openToNewClients,
    virtual: travisWhite.virtual,
    inPerson: travisWhite.inPerson,
    specialties: labels("specialty"),
    modalities: labels("modality"),
    insurance: labels("insurance"),
    identity: labels("identity"),
    location: {
      address: travisWhite.location.address,
      state: travisWhite.location.state,
      zip: travisWhite.location.zip,
    },
    rates: travisWhite.rates.map((rate) => ({
      service_type: rate.service_type,
      duration_minutes: rate.duration_minutes,
      price_cents: rate.price_cents,
    })),
    slidingScale: travisWhite.slidingScale,
    slidingScaleMinCents: null,
    slidingScaleMaxCents: null,
    cards: travisWhite.cards.map((card) => ({
      prompt: card.prompt,
      answer: card.answer,
      tag: card.tag,
    })),
    about: travisWhite.about,
    email: travisWhite.email,
    phone: travisWhite.phone,
    outreach: labels("outreach"),
    feedback: "",
  };
}
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
    expect(sql).toContain("v_email text := lower(spec->>'email')");
    expect(sql).toContain("where lower(u.email) = v_email");
    expect(sql).toContain("email = excluded.email");
    expect(sql).not.toMatch(/^\s*email text :=/m);
    expect(sql).toContain(TRAVIS_PROFILE_ID);
    expect(sql).toContain("Refusing to apply: email");
    expect(sql).toContain("Refusing to retarget profile");
    expect(sql).toContain("Travis profile id changed");
    expect(travisWhite.profileId).toBe(TRAVIS_PROFILE_ID);
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
    expect(travisWhite.cards.map((card) => card.prompt)).toEqual([
      "who I work best with...",
      "my approach to therapy is...",
      "I specialize in unpacking...",
      "a session with me feels like...",
      "outside of session, I...",
    ]);
    expect(
      travisWhite.cards.some((card) =>
        card.prompt.startsWith("before we start"),
      ),
    ).toBe(false);
    expect(sql).toContain(
      "delete from public.profile_items where therapist_id = uid",
    );
    expect(sql).toContain("Travis before-we-start card was not removed");
    expect(sql).toContain("Travis conversation cards were not saved");
    expect(sql).toContain("38047");
    expect(sql).toContain("15000");
    expect(travisWhite.location).toMatchObject({
      address: "1102 West 6th Street, Austin",
      state: "TX",
      zip: "78703",
    });
    expect(sql).toContain("1102 West 6th Street, Austin");
    expect(sql).toContain("78703");
    expect(sql).toContain("Travis state license was not saved");
    expect(sql).toContain("Travis session format was not saved");
    expect(sql).toContain("Travis office address was not saved");
  });

  it("passes join validation except years practicing, which is unpublished", () => {
    const draft = joinDraftFromTravis();
    const errors = [
      ...step1Errors(draft),
      ...step2Errors(draft),
      ...step3Errors(draft),
      ...step4Errors(draft),
    ];
    expect(errors).toEqual(["Years practicing is required"]);
    expect(draft.licenses).toEqual([{ number: "38047", state: "TX" }]);
    expect(draft.virtual).toBe(true);
    expect(draft.inPerson).toBe(true);
    expect(draft.location).toMatchObject({
      address: "1102 West 6th Street, Austin",
      state: "TX",
      zip: "78703",
    });
    expect(draft.photoKey).toBe(`${TRAVIS_PROFILE_ID}/photo.jpg`);
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
