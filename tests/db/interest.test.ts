import { afterAll, describe, expect, it } from "vitest";
import { interestAlias } from "@/lib/interest/alias";
import {
  createAnonClient,
  createJrClient,
  createMayaClient,
  dbConfigured,
  JORDAN_ID,
  JR_ID,
  MAYA_ID,
} from "./client";

describe.skipIf(!dbConfigured())("interest inbox", () => {
  afterAll(async () => {
    const jr = await createJrClient();
    await jr.from("interest").delete().eq("therapist_id", JORDAN_ID);
  });

  it("hides interest rows from anon", async () => {
    const supabase = createAnonClient();
    const { data, error } = await supabase.from("interest").select("id");
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it("lets Maya list aliases without seed patient names", async () => {
    const supabase = await createMayaClient();
    const { data, error } = await supabase.rpc("list_my_interest");
    expect(error).toBeNull();

    const aliases = (data ?? []).map((row: { alias: string }) => row.alias);
    expect(aliases).toEqual(
      expect.arrayContaining([
        interestAlias(JR_ID),
        "Patient · 3333",
        "Patient · 4444",
      ]),
    );
    expect(JSON.stringify(data)).not.toMatch(/J\. R\.|Priya|D\. M\./i);
    expect(JSON.stringify(data)).not.toMatch(/@kitchensink\.demo/);
  });

  it("blocks Maya from reading a seed patient profile", async () => {
    const supabase = await createMayaClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, name, email")
      .eq("id", JR_ID)
      .maybeSingle();
    expect(data).toBeNull();
  });

  it("rejects a therapist inserting interest", async () => {
    const supabase = await createMayaClient();
    const { error } = await supabase.from("interest").insert({
      patient_id: MAYA_ID,
      therapist_id: JORDAN_ID,
    });
    expect(error).not.toBeNull();
  });

  it("lets a patient toggle interest on another open therapist", async () => {
    const supabase = await createJrClient();
    const inserted = await supabase.from("interest").insert({
      patient_id: JR_ID,
      therapist_id: JORDAN_ID,
    });
    expect(inserted.error).toBeNull();

    const listed = await supabase
      .from("interest")
      .select("therapist_id")
      .eq("therapist_id", JORDAN_ID)
      .maybeSingle();
    expect(listed.data?.therapist_id).toBe(JORDAN_ID);

    const removed = await supabase
      .from("interest")
      .delete()
      .eq("patient_id", JR_ID)
      .eq("therapist_id", JORDAN_ID);
    expect(removed.error).toBeNull();
  });
});
