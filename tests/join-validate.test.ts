import { describe, expect, it } from "vitest";
import { normalizeCustomLabel } from "@/lib/join/cards";
import { startDateFromYears } from "@/lib/join/dates";
import type { JoinDraft } from "@/lib/join/types";
import {
  buildJoinPayload,
  canContinue,
  continueHint,
  step1Errors,
  step2Errors,
  step3Errors,
  step4Errors,
} from "@/lib/join/validate";

function emptyDraft(overrides: Partial<JoinDraft> = {}): JoinDraft {
  return {
    name: "",
    credential: "",
    yearsPracticing: "",
    supervisorName: "",
    supervisorLicense: "",
    licenses: [],
    photoKey: null,
    videoKey: null,
    openToNewClients: true,
    virtual: false,
    inPerson: false,
    specialties: [],
    modalities: [],
    insurance: [],
    identity: [],
    location: null,
    rates: [],
    cards: [],
    about: "",
    email: "",
    phone: "",
    outreach: [],
    feedback: "",
    ...overrides,
  };
}

function validStep1(overrides: Partial<JoinDraft> = {}): JoinDraft {
  return emptyDraft({
    name: "Maya Chen",
    credential: "LMFT",
    yearsPracticing: 9,
    licenses: [{ number: "MFC 112938", state: "CA" }],
    ...overrides,
  });
}

function validStep2(overrides: Partial<JoinDraft> = {}): JoinDraft {
  return validStep1({
    photoKey: "uid/photo.jpg",
    videoKey: "uid/intro.mp4",
    ...overrides,
  });
}

function validStep3(overrides: Partial<JoinDraft> = {}): JoinDraft {
  return validStep2({
    virtual: true,
    specialties: ["Anxiety"],
    modalities: ["CBT"],
    insurance: ["Aetna"],
    identity: ["BIPOC"],
    ...overrides,
  });
}

function validStep4(overrides: Partial<JoinDraft> = {}): JoinDraft {
  return validStep3({
    rates: [{ service_type: "Individual", duration_minutes: 50, price_cents: 16500 }],
    cards: [
      {
        prompt: "my approach to therapy is...",
        answer: "Collaborative and warm.",
        tag: "approach",
      },
    ],
    email: "maya@example.com",
    outreach: ["email"],
    ...overrides,
  });
}

describe("join validation", () => {
  it("requires supervisor fields for associate AMFT on step 1", () => {
    const draft = validStep1({
      credential: "Associate MFT (AMFT)",
      supervisorName: "",
      supervisorLicense: "",
    });

    expect(canContinue(1, draft)).toBe(false);
    expect(step1Errors(draft).length).toBeGreaterThan(0);
    expect(continueHint(1, draft)).toBe(
      "Add your supervising clinician's name before submitting.",
    );
  });

  it("allows LMFT to continue step 1 without supervisor fields", () => {
    const draft = validStep1({ credential: "LMFT" });

    expect(canContinue(1, draft)).toBe(true);
    expect(step1Errors(draft)).toEqual([]);
  });

  it("fails duplicate license states on step 1", () => {
    const draft = validStep1({
      licenses: [
        { number: "111", state: "CA" },
        { number: "222", state: "CA" },
      ],
    });

    expect(canContinue(1, draft)).toBe(false);
    expect(step1Errors(draft).some((e) => /duplicate|unique/i.test(e))).toBe(
      true,
    );
  });

  it("fails step 2 without photo", () => {
    const withoutPhoto = validStep1({ videoKey: "uid/intro.mp4" });

    expect(canContinue(2, withoutPhoto)).toBe(false);
    expect(continueHint(2, withoutPhoto)).toBe("Add a photo to continue");
    expect(step2Errors(withoutPhoto).length).toBeGreaterThan(0);
  });

  it("allows step 2 with photo and no intro video", () => {
    const withoutVideo = validStep1({ photoKey: "uid/photo.jpg" });

    expect(canContinue(2, withoutVideo)).toBe(true);
    expect(continueHint(2, withoutVideo)).toBe("");
    expect(step2Errors(withoutVideo)).toEqual([]);
  });

  it("fails in-person without location on step 3", () => {
    const draft = validStep2({
      virtual: false,
      inPerson: true,
      location: null,
    });

    expect(canContinue(3, draft)).toBe(false);
    expect(step3Errors(draft).length).toBeGreaterThan(0);
  });

  it("allows virtual-only without location on step 3", () => {
    const draft = validStep2({
      virtual: true,
      inPerson: false,
      location: null,
      specialties: ["Anxiety"],
    });

    expect(canContinue(3, draft)).toBe(true);
    expect(step3Errors(draft)).toEqual([]);
  });

  it("fails duplicate rate service types on step 4", () => {
    const draft = validStep3({
      rates: [
        { service_type: "Individual", duration_minutes: 50, price_cents: 16500 },
        { service_type: "Individual", duration_minutes: 60, price_cents: 18000 },
      ],
      cards: [
        {
          prompt: "my approach to therapy is...",
          answer: "Warm.",
          tag: "approach",
        },
      ],
      email: "maya@example.com",
      outreach: ["email"],
    });

    expect(canContinue(4, draft)).toBe(false);
    expect(step4Errors(draft).some((e) => /duplicate|unique/i.test(e))).toBe(
      true,
    );
  });

  it("shows tag count hint on step 3", () => {
    const draft = validStep2({
      virtual: true,
      specialties: ["Anxiety", "Depression"],
      modalities: ["CBT"],
      insurance: ["Aetna"],
      identity: ["BIPOC"],
    });

    expect(continueHint(3, draft)).toBe("5 tags selected");
  });

  it("shows card count hint on step 4", () => {
    const draft = validStep3({
      rates: [{ service_type: "Individual", duration_minutes: 50, price_cents: 16500 }],
      cards: [
        { prompt: "my approach to therapy is...", answer: "Warm.", tag: "approach" },
        { prompt: "a session with me feels like...", answer: "", tag: "session_vibe" },
      ],
      email: "maya@example.com",
      outreach: ["email"],
    });

    expect(continueHint(4, draft)).toBe("1 of 3 cards");
  });
});

describe("join dates", () => {
  it("returns a start date roughly years ago", () => {
    const now = new Date("2026-09-19T12:00:00Z");
    const startDate = startDateFromYears(9, now);
    const year = Number(startDate.slice(0, 4));

    expect(year).toBe(2017);
    expect(startDate).toBe("2017-09-19");
  });

  it("clamps invalid years to today", () => {
    const now = new Date("2026-09-19T12:00:00Z");
    expect(startDateFromYears(-3, now)).toBe("2026-09-19");
    expect(startDateFromYears(NaN, now)).toBe("2026-09-19");
  });
});

describe("normalizeCustomLabel", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeCustomLabel("  eating   disorders  ")).toBe(
      "eating disorders",
    );
  });

  it("returns null for empty labels", () => {
    expect(normalizeCustomLabel("   ")).toBeNull();
    expect(normalizeCustomLabel("")).toBeNull();
  });
});

describe("buildJoinPayload", () => {
  it("includes outreach tags and omits supervisor for LMFT", () => {
    const draft = validStep4({
      credential: "LMFT",
      yearsPracticing: 9,
      outreach: ["email", "phone"],
      phone: "(415) 555-0199",
      insurance: ["Aetna", "Out-of-Network Superbill"],
    });

    const payload = buildJoinPayload(draft);

    expect(payload.supervisor_name).toBeNull();
    expect(payload.supervisor_license).toBeNull();
    expect(payload.start_date).toBe("2017-09-19");
    expect(payload.superbill).toBe(true);
    expect(payload.tags).toEqual(
      expect.arrayContaining([
        { kind: "specialty", label: "Anxiety" },
        { kind: "modality", label: "CBT" },
        { kind: "insurance", label: "Aetna" },
        { kind: "insurance", label: "Out-of-Network Superbill" },
        { kind: "identity", label: "BIPOC" },
        { kind: "outreach", label: "email" },
        { kind: "outreach", label: "phone" },
      ]),
    );
  });

  it("throws when draft is incomplete", () => {
    expect(() => buildJoinPayload(emptyDraft())).toThrow();
  });

  it("allows a null intro video key", () => {
    const payload = buildJoinPayload(validStep4({ videoKey: null }));
    expect(payload.video_key).toBeNull();
  });
});
