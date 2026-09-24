import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createMayaClient, dbConfigured, MAYA_ID, openSeedProfile } from "./client";

describe.skipIf(!dbConfigured())("owner write constraints", () => {
  const customLabel = `test-suite-${randomUUID().slice(0, 8)}`;

  afterAll(async () => {
    if (!(await openSeedProfile(MAYA_ID))) return;
    const supabase = await createMayaClient();
    await supabase
      .from("tags")
      .delete()
      .eq("profile_id", MAYA_ID)
      .eq("kind", "specialty")
      .eq("label", customLabel);
    await supabase.from("licenses").delete().eq("therapist_id", MAYA_ID).eq("state", "OR");
    await supabase
      .from("rates")
      .delete()
      .eq("therapist_id", MAYA_ID)
      .eq("service_type", "Couples");
  });

  it("allows a custom specialty tag", async ({ skip }) => {
    if (!(await openSeedProfile(MAYA_ID))) skip();
    const supabase = await createMayaClient();
    const { error } = await supabase.from("tags").insert({
      profile_id: MAYA_ID,
      kind: "specialty",
      label: customLabel,
    });
    expect(error).toBeNull();
  });

  it("rejects a second license in the same state", async ({ skip }) => {
    if (!(await openSeedProfile(MAYA_ID))) skip();
    const supabase = await createMayaClient();
    const { error } = await supabase.from("licenses").insert({
      therapist_id: MAYA_ID,
      number: "DUP-000",
      state: "CA",
    });
    expect(error?.code).toBe("23505");
  });

  it("rejects a second rate for the same service type", async ({ skip }) => {
    if (!(await openSeedProfile(MAYA_ID))) skip();
    const supabase = await createMayaClient();
    const { error } = await supabase.from("rates").insert({
      therapist_id: MAYA_ID,
      service_type: "Individual",
      duration_minutes: 60,
      price_cents: 18000,
    });
    expect(error?.code).toBe("23505");
  });

  it("allows another state license and another service rate", async ({ skip }) => {
    if (!(await openSeedProfile(MAYA_ID))) skip();
    const supabase = await createMayaClient();
    const license = await supabase.from("licenses").insert({
      therapist_id: MAYA_ID,
      number: "C1234",
      state: "OR",
    });
    expect(license.error).toBeNull();

    const rate = await supabase.from("rates").insert({
      therapist_id: MAYA_ID,
      service_type: "Couples",
      duration_minutes: 50,
      price_cents: 18500,
    });
    expect(rate.error).toBeNull();
  });
});
