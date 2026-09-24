import { describe, expect, it } from "vitest";
import { fetchTherapistProfile } from "@/lib/therapists/load";
import { createAnonClient, dbConfigured, MAYA_ID, openSeedProfile } from "./db/client";

describe.skipIf(!dbConfigured())("fetchTherapistProfile", () => {
  it("resolves /t/maya and the seed UUID to the same open therapist", async ({
    skip,
  }) => {
    if (!(await openSeedProfile(MAYA_ID))) skip();
    const supabase = createAnonClient();
    const bySlug = await fetchTherapistProfile(supabase, "maya");
    const byId = await fetchTherapistProfile(supabase, MAYA_ID);

    expect(bySlug?.id).toBe(MAYA_ID);
    expect(byId?.id).toBe(MAYA_ID);
    expect(bySlug?.name).toBe("Dr. Maya Chen");
    expect(bySlug?.credential).toBe("LMFT");
    expect(bySlug?.education).toEqual(
      expect.arrayContaining(["B.A. Psychology", "M.A. Counseling Psychology"]),
    );
    expect(bySlug?.credentials).toEqual(expect.arrayContaining(["EMDR trained"]));
    expect(bySlug?.photoUrl).toContain(
      `/storage/v1/object/public/photos/${MAYA_ID}/photo.jpg`,
    );
    expect(bySlug?.videoUrl).toContain(
      `/storage/v1/object/public/videos/${MAYA_ID}/intro.mp4`,
    );
    expect(bySlug?.licenses).toEqual(
      expect.arrayContaining([{ number: "MFC 112938", state: "CA" }]),
    );
    expect(bySlug?.rates[0]).toMatchObject({
      service_type: "Individual",
      duration_minutes: 50,
      price_cents: 16500,
    });
    expect(bySlug?.cards).toHaveLength(3);
    expect(bySlug?.reviews).toHaveLength(3);
    expect(bySlug?.contact.map((c) => c.kind)).toEqual([
      "email",
      "phone",
      "text",
    ]);
    expect(bySlug?.contact[0]?.href).toBe("mailto:maya@kitchensink.demo");
    expect(bySlug?.contact[1]?.href).toBe("tel:+14155550199");
  });

  it("returns null for an unknown therapist", async () => {
    const supabase = createAnonClient();
    const missing = await fetchTherapistProfile(
      supabase,
      "00000000-0000-4000-8000-000000000000",
    );
    expect(missing).toBeNull();
  });
});
