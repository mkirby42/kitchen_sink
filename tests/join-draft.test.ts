import { describe, expect, it } from "vitest";
import { draftFromRows } from "@/lib/join/load-draft";
import { yearsPracticing } from "@/lib/therapists/display";

describe("draftFromRows", () => {
  it("maps a saved therapist into the join wizard draft", () => {
    const draft = draftFromRows({
      email: "fallback@example.com",
      profile: {
        name: "Maya Chen",
        email: "maya@example.com",
        phone: "415-555-0199",
        about_me: "Warm, practical therapy.",
        photo_key: "uid/photo.jpg",
        video_key: "uid/intro.mp4",
      },
      therapist: {
        credential: "LMFT",
        start_date_of_practice: "2017-01-01",
        open_to_new_clients: true,
        virtual_practice: true,
        in_person_practice: false,
        supervisor_name: null,
        supervisor_license: null,
      },
      licenses: [{ number: "MFC 112938", state: "CA" }],
      rates: [
        {
          service_type: "Individual",
          duration_minutes: 50,
          price_cents: 16500,
        },
      ],
      tags: [
        { kind: "specialty", label: "Anxiety" },
        { kind: "modality", label: "CBT" },
        { kind: "outreach", label: "email" },
      ],
      items: [
        {
          prompt: "my approach to therapy is...",
          answer: "Collaborative.",
          tag: "approach",
        },
      ],
      location: null,
    });

    expect(draft.name).toBe("Maya Chen");
    expect(draft.email).toBe("maya@example.com");
    expect(draft.credential).toBe("LMFT");
    expect(draft.yearsPracticing).toBe(yearsPracticing("2017-01-01"));
    expect(draft.photoKey).toBe("uid/photo.jpg");
    expect(draft.specialties).toEqual(["Anxiety"]);
    expect(draft.outreach).toEqual(["email"]);
    expect(draft.cards).toHaveLength(1);
    expect(draft.feedback).toBe("");
  });
});
