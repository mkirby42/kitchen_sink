import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createAnonClient,
  createJrClient,
  createMayaClient,
  dbConfigured,
  JR_ID,
  MAYA_ID,
} from "./client";

const AMARA_ID = "55555555-5555-4555-8555-555555555002";
const BODY = "Test-suite review. Safe to delete.";

async function ratingsReady() {
  const { data, error } = await createAnonClient()
    .from("reviews")
    .select("stars_cat_1")
    .eq("therapist_id", MAYA_ID)
    .not("stars_cat_1", "is", null)
    .limit(1);
  return !error && (data?.length ?? 0) > 0;
}

async function clearFixture() {
  const jr = await createJrClient();
  await jr
    .from("reviews")
    .delete()
    .eq("therapist_id", AMARA_ID)
    .eq("patient_id", JR_ID);
}

describe.skipIf(!dbConfigured())("client reviews", () => {
  let ready = false;

  beforeAll(async () => {
    ready = await ratingsReady();
    if (ready) await clearFixture();
  });

  afterAll(async () => {
    if (ready) await clearFixture();
  });

  it("lets a patient post an anonymous review, blocks everyone else, then removes it", async (ctx) => {
    if (!ready) ctx.skip();

    const jr = await createJrClient();
    const inserted = await jr.from("reviews").insert({
      therapist_id: AMARA_ID,
      patient_id: JR_ID,
      author_name: "Should not stick",
      anonymous: true,
      stars_cat_1: 5,
      stars_cat_2: 4,
      stars_cat_3: 5,
      body: BODY,
    });
    expect(inserted.error).toBeNull();

    const anon = createAnonClient();
    const visible = await anon
      .from("reviews")
      .select("author_name, anonymous, stars_cat_1, stars_cat_2, stars_cat_3, stars_avg, body")
      .eq("therapist_id", AMARA_ID)
      .eq("body", BODY)
      .maybeSingle();
    expect(visible.error).toBeNull();
    expect(visible.data).toMatchObject({
      author_name: null,
      anonymous: true,
      body: BODY,
    });
    expect(Number(visible.data?.stars_cat_1)).toBe(5);
    expect(Number(visible.data?.stars_cat_2)).toBe(4);
    expect(Number(visible.data?.stars_cat_3)).toBe(5);
    expect(Number(visible.data?.stars_avg)).toBeCloseTo(14 / 3, 5);

    const named = await jr
      .from("reviews")
      .update({
        anonymous: false,
        author_name: "J. R.",
        stars_cat_1: 4,
        stars_cat_2: 4,
        stars_cat_3: 4,
        body: "   ",
      })
      .eq("therapist_id", AMARA_ID)
      .eq("patient_id", JR_ID);
    expect(named.error).toBeNull();

    const renamed = await anon
      .from("reviews")
      .select("author_name, stars_avg, body")
      .eq("therapist_id", AMARA_ID)
      .eq("patient_id", JR_ID)
      .maybeSingle();
    expect(renamed.data?.author_name).toBe("J. R.");
    expect(renamed.data?.body).toBeNull();
    expect(Number(renamed.data?.stars_avg)).toBe(4);

    const maya = await createMayaClient();
    const therapistInsert = await maya.from("reviews").insert({
      therapist_id: AMARA_ID,
      patient_id: MAYA_ID,
      author_name: "Maya",
      anonymous: false,
      body: "Therapists cannot review.",
    });
    expect(therapistInsert.error).not.toBeNull();

    const anonInsert = await anon.from("reviews").insert({
      therapist_id: AMARA_ID,
      patient_id: JR_ID,
      anonymous: true,
      body: "Anon cannot review.",
    });
    expect(anonInsert.error).not.toBeNull();

    const removed = await jr
      .from("reviews")
      .delete()
      .eq("therapist_id", AMARA_ID)
      .eq("patient_id", JR_ID);
    expect(removed.error).toBeNull();

    const missingRatings = await jr.from("reviews").insert({
      therapist_id: AMARA_ID,
      patient_id: JR_ID,
      anonymous: true,
      body: BODY,
    });
    expect(missingRatings.error).not.toBeNull();

    const fractional = await jr.from("reviews").insert({
      therapist_id: AMARA_ID,
      patient_id: JR_ID,
      anonymous: true,
      stars_cat_1: 4.5,
      stars_cat_2: 5,
      stars_cat_3: 5,
      body: BODY,
    });
    expect(fractional.error).not.toBeNull();

    const gone = await anon
      .from("reviews")
      .select("id")
      .eq("therapist_id", AMARA_ID)
      .eq("patient_id", JR_ID);
    expect(gone.data).toEqual([]);
  });
});
