import { describe, expect, it } from "vitest";
import {
  CREDENTIALS,
  MODALITY_PRESETS,
  SPECIALTY_PRESETS,
} from "@/lib/tags/presets";

describe("join presets", () => {
  it("includes credentials and modalities", () => {
    expect(CREDENTIALS).toContain("LMFT");
    expect(CREDENTIALS).not.toContain("Associate MFT (AMFT)");
    expect(MODALITY_PRESETS).toContain("CBT");
    expect(MODALITY_PRESETS).toContain("EMDR");
  });

  it("lists specialty presets, with Self Discovery in place of Teens", () => {
    expect(SPECIALTY_PRESETS).toEqual([
      "Anxiety",
      "Depression",
      "Trauma & PTSD",
      "Couples & Relationships",
      "ADHD",
      "Grief & Loss",
      "Life Transitions",
      "Self Discovery",
      "Immigration",
    ]);
    expect(SPECIALTY_PRESETS).not.toContain("Teens");
  });
});
