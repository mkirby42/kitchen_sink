import { describe, expect, it } from "vitest";
import { toRpcArgs } from "@/lib/join/submit";
import type { JoinDraft } from "@/lib/join/types";
import { buildJoinPayload } from "@/lib/join/validate";

const draft: JoinDraft = {
  name: "Maya Chen",
  credential: "LMFT",
  yearsPracticing: 9,
  supervisorName: "",
  supervisorLicense: "",
  licenses: [{ number: "MFC 112938", state: "CA" }],
  photoKey: "user-id/photo.jpg",
  videoKey: "user-id/intro.mp4",
  openToNewClients: true,
  virtual: true,
  inPerson: false,
  specialties: ["Anxiety"],
  modalities: ["CBT"],
  insurance: ["Aetna"],
  identity: ["BIPOC"],
  location: null,
  rates: [
    {
      service_type: "Individual",
      duration_minutes: 50,
      price_cents: 16500,
    },
  ],
  cards: [
    {
      prompt: "my approach to therapy is...",
      answer: "Collaborative and warm.",
      tag: "approach",
    },
  ],
  about: "Warm, practical therapy.",
  email: "maya@example.com",
  phone: "",
  outreach: ["email"],
  feedback: "",
};

describe("toRpcArgs", () => {
  it("maps the join payload to the hosted RPC parameter names", () => {
    const payload = buildJoinPayload(draft);

    expect(toRpcArgs(payload)).toEqual({
      p_name: payload.name,
      p_email: payload.email,
      p_phone: payload.phone,
      p_about: payload.about,
      p_photo_key: payload.photo_key,
      p_video_key: payload.video_key,
      p_credential: payload.credential,
      p_start_date: payload.start_date,
      p_open_to_new_clients: payload.open_to_new_clients,
      p_virtual: payload.virtual_practice,
      p_in_person: payload.in_person_practice,
      p_supervisor_name: payload.supervisor_name,
      p_supervisor_license: payload.supervisor_license,
      p_superbill: payload.superbill,
      p_licenses: payload.licenses,
      p_rates: payload.rates,
      p_location: payload.location,
      p_tags: payload.tags,
      p_items: payload.items,
      p_feedback: payload.feedback,
    });
  });

  it("passes photo and intro video storage keys through unchanged", () => {
    const payload = buildJoinPayload(draft);
    const args = toRpcArgs(payload);

    expect(args.p_photo_key).toBe("user-id/photo.jpg");
    expect(args.p_video_key).toBe("user-id/intro.mp4");
  });

  it("passes a null intro video key through when omitted", () => {
    const payload = buildJoinPayload({ ...draft, videoKey: null });
    const args = toRpcArgs(payload);

    expect(args.p_video_key).toBeNull();
  });
});
