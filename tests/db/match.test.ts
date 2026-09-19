import { describe, expect, it } from "vitest";
import { createAnonClient, dbConfigured, MAYA_ID, search } from "./client";

describe.skipIf(!dbConfigured())("search_therapists match model", () => {
  it("returns open therapists when no tags are selected", async () => {
    const rows = await search(createAnonClient());
    expect(rows.some((row) => row.profile_id === MAYA_ID)).toBe(true);
  });

  it("matches Maya on a specialty she has", async () => {
    const rows = await search(createAnonClient(), { p_tags: ["Anxiety"] });
    expect(rows.map((row) => row.profile_id)).toContain(MAYA_ID);
    expect(rows.length).toBeGreaterThan(1);
  });

  it("ORs selected tags: Aetna matches even with an unmatched specialty", async () => {
    const rows = await search(createAnonClient(), { p_tags: ["ADHD", "Aetna"] });
    expect(rows.map((row) => row.profile_id)).toContain(MAYA_ID);
  });

  it("does not match a tag nobody has", async () => {
    const rows = await search(createAnonClient(), { p_tags: ["Medicare"] });
    expect(rows).toEqual([]);
  });

  it("filters by license state", async () => {
    const ca = await search(createAnonClient(), { p_state: "CA" });
    const ny = await search(createAnonClient(), { p_state: "NY" });
    expect(ca.map((row) => row.profile_id)).toContain(MAYA_ID);
    expect(ny.map((row) => row.profile_id)).not.toContain(MAYA_ID);
    expect(ny.length).toBeGreaterThan(0);
  });

  it("returns the lowest rate as starting price and no video key", async () => {
    const rows = await search(createAnonClient(), { p_tags: ["Anxiety"] });
    const maya = rows.find((row) => row.profile_id === MAYA_ID);
    expect(maya?.min_price_cents).toBe(16500);
    expect(maya?.photo_key).toBe(`${MAYA_ID}/photo.jpg`);
    expect(rows[0]).not.toHaveProperty("video_key");
  });

  it("caps page size at 24", async () => {
    const rows = await search(createAnonClient(), { p_limit: 100 });
    expect(rows.length).toBeLessThanOrEqual(24);
  });
});
