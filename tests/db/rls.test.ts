import { describe, expect, it } from "vitest";
import { createAnonClient, dbConfigured, MAYA_ID, openSeedProfile } from "./client";

describe.skipIf(!dbConfigured())("public RLS", () => {
  it("lets anon read Maya's open profile, rates, licenses, and reviews", async ({
    skip,
  }) => {
    if (!(await openSeedProfile(MAYA_ID))) skip();
    const supabase = createAnonClient();
    const profile = await supabase
      .from("profiles")
      .select("id, name, role")
      .eq("id", MAYA_ID)
      .single();
    expect(profile.error).toBeNull();
    expect(profile.data?.name).toBe("Dr. Maya Chen");

    const rates = await supabase.from("rates").select("price_cents").eq("therapist_id", MAYA_ID);
    expect(rates.error).toBeNull();
    expect(rates.data).toEqual([{ price_cents: 16500 }]);

    const licenses = await supabase
      .from("licenses")
      .select("state, number")
      .eq("therapist_id", MAYA_ID);
    expect(licenses.error).toBeNull();
    expect(licenses.data).toEqual([{ state: "CA", number: "MFC 112938" }]);

    const reviews = await supabase
      .from("reviews")
      .select("stars_avg")
      .eq("therapist_id", MAYA_ID);
    expect(reviews.error).toBeNull();
    expect(reviews.data?.length).toBe(3);
  });

  it("hides owner-only feedback from anon", async () => {
    const supabase = createAnonClient();
    const { data, error } = await supabase.from("feedback").select("id");
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("rejects anon inserts into tags", async () => {
    const supabase = createAnonClient();
    const { error } = await supabase.from("tags").insert({
      profile_id: MAYA_ID,
      kind: "specialty",
      label: "test-suite-should-fail",
    });
    expect(error).not.toBeNull();
  });
});
