import { describe, expect, it } from "vitest";
import {
  directorySpecialties,
  SPECIALTY_PRESETS,
} from "@/lib/tags/presets";

describe("directory specialties", () => {
  it("keeps only labels from the Find specialty list, in stored order", () => {
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
    ).toEqual(["Anxiety", "Depression", "Couples & Relationships", "Life Transitions"]);
  });

  it("shows a stored Teens specialty as Self Discovery", () => {
    expect(directorySpecialties(["Teens", "Anxiety", "Self Discovery"])).toEqual(
      ["Self Discovery", "Anxiety"],
    );
  });

  it("uses the same list Find filters by", () => {
    expect(directorySpecialties([...SPECIALTY_PRESETS])).toEqual([
      ...SPECIALTY_PRESETS,
    ]);
    expect(directorySpecialties(["Not a specialty"])).toEqual([]);
  });
});
