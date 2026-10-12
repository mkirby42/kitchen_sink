import { describe, expect, it } from "vitest";
import {
  directorySpecialties,
  SPECIALTY_PRESETS,
} from "@/lib/tags/presets";

describe("directory specialties", () => {
  it("keeps preset and custom labels, in stored order", () => {
    expect(
      directorySpecialties([
        "Career",
        "Anxiety",
        "College Students",
        "Panic Attacks",
        "Depression",
        "Stress",
        "Therapy for Men",
        "Couples & Relationships",
        "Life Transitions",
      ]),
    ).toEqual([
      "Career",
      "Anxiety",
      "College Students",
      "Panic Attacks",
      "Depression",
      "Stress",
      "Therapy for Men",
      "Couples & Relationships",
      "Life Transitions",
    ]);
  });

  it("shows a stored Teens specialty as Self Discovery", () => {
    expect(directorySpecialties(["Teens", "Anxiety", "Self Discovery"])).toEqual(
      ["Self Discovery", "Anxiety"],
    );
  });

  it("keeps the Find preset list and a custom label", () => {
    expect(directorySpecialties([...SPECIALTY_PRESETS])).toEqual([
      ...SPECIALTY_PRESETS,
    ]);
    expect(directorySpecialties(["Not a specialty"])).toEqual([
      "Not a specialty",
    ]);
  });
});
