import { describe, expect, it } from "vitest";
import {
  overlapCopy,
  searchCardLabels,
} from "@/lib/search/overlap";

describe("search overlap copy", () => {
  it("shows how many selected tags hit", () => {
    expect(overlapCopy(3, 4)).toBe("3 of 4 tags");
  });

  it("uses the singular when one tag is selected", () => {
    expect(overlapCopy(1, 1)).toBe("1 of 1 tag");
  });

  it("hides the line when no tags are selected", () => {
    expect(overlapCopy(0, 0)).toBeNull();
  });
});

describe("search card labels", () => {
  it("keeps format and specialty chips, then appends insurance hits", () => {
    expect(
      searchCardLabels({
        virtual_practice: true,
        in_person_practice: false,
        specialty_labels: ["Anxiety", "Life Transitions"],
        matched_labels: ["Aetna", "Anxiety"],
      }),
    ).toEqual(["Virtual", "Anxiety", "Life Transitions", "Aetna"]);
  });

  it("does not duplicate a specialty that already hit", () => {
    expect(
      searchCardLabels({
        virtual_practice: false,
        in_person_practice: false,
        specialty_labels: ["ADHD"],
        matched_labels: ["ADHD", "Aetna"],
      }),
    ).toEqual(["ADHD", "Aetna"]);
  });
});
