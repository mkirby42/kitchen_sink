import { describe, expect, it } from "vitest";
import {
  createAnonClient,
  dbConfigured,
  MAYA_ID,
  openSeedProfile,
  search,
} from "./client";

const ELENA_ID = "55555555-5555-4555-8555-555555555004";
const JORDAN_ID = "55555555-5555-4555-8555-555555555001";

describe.skipIf(!dbConfigured())("search_therapists match model", () => {
  it("returns open therapists when no tags are selected", async ({ skip }) => {
    if (!(await openSeedProfile(MAYA_ID))) skip();
    const rows = await search(createAnonClient());
    expect(rows.some((row) => row.profile_id === MAYA_ID)).toBe(true);
    expect(rows.every((row) => row.match_count === 0)).toBe(true);
    expect(rows[0]?.matched_labels).toEqual([]);
  });

  it("matches Maya on a specialty she has", async ({ skip }) => {
    if (!(await openSeedProfile(MAYA_ID))) skip();
    const rows = await search(createAnonClient(), { p_tags: ["Anxiety"] });
    expect(rows.map((row) => row.profile_id)).toContain(MAYA_ID);
    expect(rows.length).toBeGreaterThan(1);
  });

  it("ORs selected tags: Aetna matches even with an unmatched specialty", async ({
    skip,
  }) => {
    if (!(await openSeedProfile(MAYA_ID))) skip();
    const rows = await search(createAnonClient(), { p_tags: ["ADHD", "Aetna"] });
    expect(rows.map((row) => row.profile_id)).toContain(MAYA_ID);
  });

  it("returns overlap count and hit labels from the same RPC", async ({ skip }) => {
    if (!(await openSeedProfile(MAYA_ID))) skip();
    const rows = await search(createAnonClient(), { p_tags: ["ADHD", "Aetna"] });
    const maya = rows.find((row) => row.profile_id === MAYA_ID);
    const jordan = rows.find((row) => row.profile_id === JORDAN_ID);
    expect(maya?.match_count).toBe(1);
    expect(maya?.matched_labels).toEqual(["Aetna"]);
    expect(jordan?.match_count).toBe(2);
    expect(jordan?.matched_labels).toEqual(["ADHD", "Aetna"]);
  });

  it("ranks OR matches by overlap count, then name", async ({ skip }) => {
    if (!(await openSeedProfile(MAYA_ID))) skip();
    const rows = await search(createAnonClient(), { p_tags: ["ADHD", "Aetna"] });
    const twoHits = rows.filter((row) => row.match_count === 2);
    expect(twoHits.map((row) => row.profile_id)).toEqual([ELENA_ID, JORDAN_ID]);
    expect(rows.findIndex((row) => row.profile_id === MAYA_ID)).toBeGreaterThan(
      rows.findIndex((row) => row.profile_id === JORDAN_ID),
    );
  });

  it("does not match a tag nobody has", async () => {
    const rows = await search(createAnonClient(), { p_tags: ["Medicare"] });
    expect(rows).toEqual([]);
  });

  it("filters by license state", async ({ skip }) => {
    if (!(await openSeedProfile(MAYA_ID))) skip();
    const ca = await search(createAnonClient(), { p_state: "CA" });
    const ny = await search(createAnonClient(), { p_state: "NY" });
    expect(ca.map((row) => row.profile_id)).toContain(MAYA_ID);
    expect(ny.map((row) => row.profile_id)).not.toContain(MAYA_ID);
    expect(ny.length).toBeGreaterThan(0);
  });

  it("returns the lowest rate as starting price and no video key", async ({
    skip,
  }) => {
    if (!(await openSeedProfile(MAYA_ID))) skip();
    const rows = await search(createAnonClient(), { p_tags: ["Anxiety"] });
    const maya = rows.find((row) => row.profile_id === MAYA_ID);
    expect(maya?.min_price_cents).toBe(16500);
    expect(maya?.min_duration_minutes).toBe(50);
    expect(maya?.photo_key).toBe(`${MAYA_ID}/photo.jpg`);
    expect(maya).not.toHaveProperty("video_key");
  });

  it("caps page size at 24", async () => {
    const rows = await search(createAnonClient(), { p_limit: 100 });
    expect(rows.length).toBeLessThanOrEqual(24);
  });
});
