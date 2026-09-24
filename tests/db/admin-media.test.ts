import { describe, expect, it } from "vitest";
import { joinMediaPath } from "@/lib/join/media";
import { uploadJoinMedia } from "@/lib/join/submit";
import {
  createAnonClient,
  createMayaClient,
  dbConfigured,
  JR_ID,
  MAYA_EMAIL,
  MAYA_ID,
  openSeedProfile,
} from "./client";

const OPS_EMAIL = "ops@example.com";
const OPS_PASSWORD = "seed-only";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function opsClient() {
  const supabase = createAnonClient();
  const signedIn = await supabase.auth.signInWithPassword({
    email: OPS_EMAIL,
    password: OPS_PASSWORD,
  });
  if (signedIn.error || !signedIn.data.session) return null;
  return supabase;
}

describe.skipIf(!dbConfigured())("admin helper upload", () => {
  it("lets ops replace a therapist photo and blocks everyone else", async ({
    skip,
  }) => {
    const ops = await opsClient();
    if (!ops) {
      console.warn(
        "Skipping admin helper upload assertions because ops@example.com cannot sign in. Apply supabase/migrations/20260925003100_admin_helper_upload.sql.",
      );
      skip();
      return;
    }

    const self = await ops.auth.getUser();
    const opsId = self.data.user?.id;
    expect(opsId).toBeTruthy();
    const roleChange = await ops
      .from("profiles")
      .update({ role: "therapist" })
      .eq("id", opsId!)
      .select("role");
    expect(roleChange.error).not.toBeNull();

    const hiddenPatient = await ops.from("profiles").select("id").eq("id", JR_ID);
    expect(hiddenPatient.error).toBeNull();
    expect(hiddenPatient.data).toEqual([]);

    if (!(await openSeedProfile(MAYA_ID))) {
      console.warn(
        "Skipping therapist media replacement because the seed therapist profile is gone.",
      );
      return;
    }

    const original = await createAnonClient()
      .from("profiles")
      .select("photo_key, name")
      .eq("id", MAYA_ID)
      .single();
    expect(original.error).toBeNull();
    const originalKey = original.data?.photo_key;
    expect(originalKey).toBeTruthy();

    const maya = await createMayaClient();
    const escalated = await maya
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", MAYA_ID)
      .select("role");
    expect(escalated.error).not.toBeNull();
    const stillTherapist = await maya
      .from("profiles")
      .select("role")
      .eq("id", MAYA_ID)
      .single();
    expect(stillTherapist.data?.role).toBe("therapist");

    const denied = await maya.rpc("admin_set_therapist_media", {
      p_therapist_id: MAYA_ID,
      p_kind: "photo",
      p_key: `${MAYA_ID}/photo.jpg`,
    });
    expect(denied.error).not.toBeNull();

    const badKey = await ops.rpc("admin_set_therapist_media", {
      p_therapist_id: MAYA_ID,
      p_kind: "photo",
      p_key: `${JR_ID}/photo.jpg`,
    });
    expect(badKey.error).not.toBeNull();

    const file = new File([PNG], "ops-pixel.png", { type: "image/png" });
    let uploadedPath: string | null = null;
    try {
      uploadedPath = await uploadJoinMedia(ops, MAYA_ID, "photo", file);
      expect(uploadedPath.startsWith(`${MAYA_ID}/`)).toBe(true);
      expect(joinMediaPath(MAYA_ID, "photo", file.name).split("/")[0]).toBe(MAYA_ID);

      const saved = await ops.rpc("admin_set_therapist_media", {
        p_therapist_id: MAYA_ID,
        p_kind: "photo",
        p_key: uploadedPath,
      });
      expect(saved.error).toBeNull();

      const renamed = await ops
        .from("profiles")
        .update({ name: "Nope" })
        .eq("id", MAYA_ID)
        .select("name");
      expect(renamed.data ?? []).toEqual([]);

      const after = await createAnonClient()
        .from("profiles")
        .select("photo_key, name, email")
        .eq("id", MAYA_ID)
        .single();
      expect(after.data?.photo_key).toBe(uploadedPath);
      expect(after.data?.name).toBe("Dr. Maya Chen");
      expect(after.data?.email).toBe(MAYA_EMAIL);
    } finally {
      if (originalKey) {
        const restored = await ops.rpc("admin_set_therapist_media", {
          p_therapist_id: MAYA_ID,
          p_kind: "photo",
          p_key: originalKey,
        });
        if (restored.error) throw restored.error;
      }
      if (uploadedPath) {
        await maya.storage.from("photos").remove([uploadedPath]);
      }
    }
  });
});
