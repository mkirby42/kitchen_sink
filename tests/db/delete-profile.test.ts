import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { deleteOwnTherapistProfile } from "@/lib/profile/delete-profile";
import { createAnonClient, dbConfigured, search } from "./client";

describe.skipIf(!dbConfigured())("delete_own_therapist_profile", () => {
  const email = `delete-profile-${randomUUID()}@gmail.com`;
  const otherEmail = `delete-profile-other-${randomUUID()}@gmail.com`;
  const password = "delete-profile-pass-1";
  let ownerId: string | null = null;

  afterAll(async () => {
    if (!ownerId) return;
    const supabase = createAnonClient();
    const signIn = await supabase.auth.signInWithPassword({ email, password });
    if (signIn.error || !signIn.data.user) return;

    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", ownerId)
      .maybeSingle();
    if (!data) return;

    const hidden = await supabase
      .from("therapists")
      .update({ open_to_new_clients: false })
      .eq("profile_id", ownerId);
    if (hidden.error) throw hidden.error;
  });

  it("lets the owner delete their profile and refuses everyone else", async ({
    skip,
  }) => {
    const probe = await createAnonClient().rpc("delete_own_therapist_profile", {
      p_confirm: "nope",
    });
    const missing =
      probe.error?.code === "PGRST202" ||
      (probe.error?.message ?? "")
        .toLowerCase()
        .includes("could not find the function");
    if (missing) {
      console.warn(
        "Skipping delete_own_therapist_profile until the migration is applied.",
      );
      skip();
      return;
    }

    const owner = createAnonClient();
    const signUp = await owner.auth.signUp({ email, password });
    if (signUp.error || !signUp.data.session || !signUp.data.user) {
      console.warn(
        "Skipping delete_own_therapist_profile assertions because Auth signup did not return a session:",
        signUp.error?.message ?? "email confirmation is required",
      );
      return;
    }

    const userId = signUp.data.user.id;
    const photoKey = `${userId}/delete-me.jpg`;
    const joined = await owner.rpc("complete_therapist_join", {
      p_name: "Delete Test Therapist",
      p_email: email,
      p_phone: "206-555-0199",
      p_about: "Profile created to test delete.",
      p_photo_key: photoKey,
      p_video_key: null,
      p_credential: "LCSW",
      p_start_date: "2018-06-01",
      p_open_to_new_clients: true,
      p_virtual: true,
      p_in_person: false,
      p_superbill: false,
      p_qualifications: [
        { kind: "education", label: "M.S.W.", position: 0 },
      ],
      p_licenses: [{ number: "DEL-WA-001", state: "WA" }],
      p_rates: [
        {
          service_type: "Individual",
          duration_minutes: 50,
          price_cents: 14000,
        },
      ],
      p_sliding_scale: true,
      p_sliding_scale_min_cents: 8000,
      p_sliding_scale_max_cents: 11000,
      p_location: null,
      p_tags: [{ kind: "specialty", label: "Grief & Loss" }],
      p_items: [
        {
          prompt: "What can clients expect?",
          answer: "A clear plan.",
          tag: "approach",
        },
        {
          prompt: "A session with me feels like...",
          answer: "Steady.",
          tag: "session_vibe",
        },
        {
          prompt: "I specialize in unpacking...",
          answer: "Grief that arrives late.",
          tag: "specialty",
        },
      ],
      p_feedback: null,
    });
    expect(joined.error).toBeNull();
    ownerId = userId;

    const uploaded = await owner.storage.from("photos").upload(
      photoKey,
      Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
      { contentType: "image/jpeg", upsert: true },
    );
    expect(uploaded.error).toBeNull();

    const direct = await owner
      .from("profiles")
      .delete()
      .eq("id", userId)
      .select("id");
    expect(direct.data ?? []).toEqual([]);
    const stillDirect = await owner
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();
    expect(stillDirect.data?.id).toBe(userId);

    const wrongPhrase = await owner.rpc("delete_own_therapist_profile", {
      p_confirm: "delete",
    });
    expect(wrongPhrase.error).not.toBeNull();
    expect(wrongPhrase.error?.message).toContain("Type DELETE to confirm");

    const anon = createAnonClient();
    const anonDelete = await anon.rpc("delete_own_therapist_profile", {
      p_confirm: "DELETE",
    });
    expect(anonDelete.error).not.toBeNull();

    const other = createAnonClient();
    const otherSign = await other.auth.signUp({
      email: otherEmail,
      password,
    });
    if (otherSign.data.session && otherSign.data.user) {
      const otherDelete = await other.rpc("delete_own_therapist_profile", {
        p_confirm: "DELETE",
      });
      expect(otherDelete.error?.message).toContain(
        "No therapist profile to delete",
      );
      const { data: otherProfile } = await other
        .from("profiles")
        .select("id")
        .eq("id", otherSign.data.user.id)
        .maybeSingle();
      expect(otherProfile).toBeNull();
    }

    const stillOwner = await owner
      .from("profiles")
      .select("id, role")
      .eq("id", userId)
      .single();
    expect(stillOwner.data).toEqual({ id: userId, role: "therapist" });

    const deleted = await deleteOwnTherapistProfile(owner, {
      userId,
      photoKey,
      videoKey: null,
      confirm: "DELETE",
    });
    expect(deleted).toEqual({ ok: true });

    const profile = await owner
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();
    expect(profile.data).toBeNull();

    const session = await owner.auth.getUser();
    expect(session.data.user?.id).toBe(userId);

    const anonRead = createAnonClient();
    const rows = await search(anonRead, { p_tags: ["Grief & Loss"] });
    expect(rows.some((row) => row.profile_id === userId)).toBe(false);

    for (const table of ["tags", "rates", "licenses", "profile_items"] as const) {
      const leftover = await owner
        .from(table)
        .select("id")
        .eq(table === "tags" ? "profile_id" : "therapist_id", userId);
      expect(leftover.error).toBeNull();
      expect(leftover.data).toEqual([]);
    }

    const qualifications = await owner
      .from("qualifications")
      .select("id")
      .eq("therapist_id", userId);
    expect(qualifications.error).toBeNull();
    expect(qualifications.data).toEqual([]);

    const therapist = await owner
      .from("therapists")
      .select("profile_id")
      .eq("profile_id", userId)
      .maybeSingle();
    expect(therapist.data).toBeNull();

    const media = await owner.storage.from("photos").list(userId);
    expect(media.error).toBeNull();
    expect(media.data?.some((file) => file.name === "delete-me.jpg")).toBe(
      false,
    );
  });
});
