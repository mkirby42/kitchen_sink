import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createAnonClient, dbConfigured, search } from "./client";

describe.skipIf(!dbConfigured())("complete_therapist_join", () => {
  const email = `join-test-${randomUUID()}@kitchensink.demo`;
  const password = "join-test-pass-1";
  let joinedUserId: string | null = null;

  afterAll(async () => {
    if (!joinedUserId) return;

    const supabase = createAnonClient();
    const signIn = await supabase.auth.signInWithPassword({ email, password });
    if (signIn.error) throw signIn.error;

    const cleanup = await supabase
      .from("therapists")
      .update({ open_to_new_clients: false })
      .eq("profile_id", joinedUserId)
      .select("profile_id")
      .single();

    if (cleanup.error) throw cleanup.error;
    if (cleanup.data?.profile_id !== joinedUserId) {
      throw new Error("Joined therapist was not disabled during cleanup");
    }
  });

  it("atomically creates a searchable therapist and requires an in-person location", async () => {
    const supabase = createAnonClient();
    const signUp = await supabase.auth.signUp({ email, password });

    // Hosted Auth can disable signups or require email confirmation. In either
    // case there is no authenticated session with which to exercise the RPC.
    if (signUp.error || !signUp.data.session || !signUp.data.user) {
      console.warn(
        "Skipping complete_therapist_join assertions because Auth signup did not return a session:",
        signUp.error?.message ?? "email confirmation is required",
      );
      return;
    }

    const userId = signUp.data.user.id;
    const photoKey = `${userId}/photo.jpg`;
    const videoKey = `${userId}/intro.mp4`;
    const baseArgs = {
      p_name: "Join Test Therapist",
      p_email: email,
      p_phone: "206-555-0100",
      p_about: "Integration-test therapist profile.",
      p_photo_key: photoKey,
      p_video_key: videoKey,
      p_credential: "LMFT",
      p_start_date: "2020-01-01",
      p_open_to_new_clients: true,
      p_virtual: true,
      p_in_person: false,
      p_supervisor_name: null,
      p_supervisor_license: null,
      p_superbill: false,
      p_licenses: [{ number: "JOIN-WA-001", state: "WA" }],
      p_rates: [
        {
          service_type: "Individual",
          duration_minutes: 50,
          price_cents: 15000,
        },
      ],
      p_location: null,
      p_tags: [{ kind: "specialty", label: "Teens" }],
      p_items: [
        {
          prompt: "What can clients expect?",
          answer: "A collaborative and practical conversation.",
          tag: "approach",
        },
      ],
      p_feedback: "Atomic join RPC integration test.",
    };

    const missingLocation = await supabase.rpc("complete_therapist_join", {
      ...baseArgs,
      p_in_person: true,
    });
    expect(missingLocation.error).not.toBeNull();
    expect(missingLocation.error?.message).toContain(
      "In-person practice requires a location",
    );

    const joined = await supabase.rpc("complete_therapist_join", baseArgs);
    if (!joined.error) joinedUserId = userId;
    expect(joined.error).toBeNull();
    expect(joined.data).toBe(userId);

    const anon = createAnonClient();
    const rows = await search(anon, { p_tags: ["Teens"] });
    expect(rows.some((row) => row.profile_id === userId)).toBe(true);

    const profile = await anon
      .from("profiles")
      .select("video_key")
      .eq("id", userId)
      .single();
    expect(profile.error).toBeNull();
    expect(profile.data?.video_key).toBe(videoKey);
  });
});
