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

async function columnReady() {
  const { error } = await createAnonClient()
    .from("reviews")
    .select("anonymous")
    .limit(1);
  return !error;
}

async function clearFixture() {
  const jr = await createJrClient();
  await jr
    .from("reviews")
    .delete()
    .eq("therapist_id", AMARA_ID)
    .eq("patient_id", JR_ID)
    .eq("body", BODY);
}

describe.skipIf(!dbConfigured())("client reviews", () => {
  let ready = false;

  beforeAll(async () => {
    ready = await columnReady();
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
      stars_avg: null,
      body: BODY,
    });
    expect(inserted.error).toBeNull();

    const anon = createAnonClient();
    const visible = await anon
      .from("reviews")
      .select("author_name, anonymous, stars_avg, body")
      .eq("therapist_id", AMARA_ID)
      .eq("body", BODY)
      .maybeSingle();
    expect(visible.error).toBeNull();
    expect(visible.data).toMatchObject({
      author_name: null,
      anonymous: true,
      stars_avg: null,
      body: BODY,
    });

    const named = await jr
      .from("reviews")
      .update({
        anonymous: false,
        author_name: "J. R.",
        stars_avg: 4,
        body: BODY,
      })
      .eq("therapist_id", AMARA_ID)
      .eq("patient_id", JR_ID);
    expect(named.error).toBeNull();

    const renamed = await anon
      .from("reviews")
      .select("author_name, stars_avg")
      .eq("therapist_id", AMARA_ID)
      .eq("body", BODY)
      .maybeSingle();
    expect(renamed.data?.author_name).toBe("J. R.");
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

    const blank = await jr.from("reviews").insert({
      therapist_id: AMARA_ID,
      patient_id: JR_ID,
      anonymous: true,
      body: "   ",
    });
    expect(blank.error).not.toBeNull();

    const removed = await jr
      .from("reviews")
      .delete()
      .eq("therapist_id", AMARA_ID)
      .eq("patient_id", JR_ID)
      .eq("body", BODY);
    expect(removed.error).toBeNull();

    const gone = await anon
      .from("reviews")
      .select("id")
      .eq("therapist_id", AMARA_ID)
      .eq("body", BODY);
    expect(gone.data).toEqual([]);
  });
});
