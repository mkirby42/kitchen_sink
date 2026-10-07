import { describe, expect, it } from "vitest";
import { overlapCopy, searchCardLabels } from "@/lib/search/overlap";

const row = {
  virtual_practice: true,
  in_person_practice: false,
  specialty_labels: ["Anxiety", "Life Transitions"],
  insurance_labels: ["Aetna", "BCBS"],
};

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
  it("keeps format chips and only specialties and insurance in the filters", () => {
    expect(searchCardLabels(row, ["Life Transitions", "Aetna", "ADHD"])).toEqual(
      ["Virtual", "Life Transitions", "Aetna"],
    );
  });

  it("omits specialties when no specialty filter is selected", () => {
    expect(searchCardLabels(row, ["Aetna", "Cigna"])).toEqual([
      "Virtual",
      "Aetna",
    ]);
  });

  it("omits insurance when no insurance filter is selected", () => {
    expect(searchCardLabels(row, ["Anxiety"])).toEqual(["Virtual", "Anxiety"]);
  });

  it("omits both groups when neither filter is selected", () => {
    expect(
      searchCardLabels(
        { ...row, in_person_practice: true },
        [],
      ),
    ).toEqual(["Virtual", "In-Person"]);
  });

  it("shows a stored Teens specialty as Self Discovery when that filter is on", () => {
    expect(
      searchCardLabels(
        {
          virtual_practice: false,
          in_person_practice: false,
          specialty_labels: ["Teens", "Anxiety"],
          insurance_labels: [],
        },
        ["Self Discovery"],
      ),
    ).toEqual(["Self Discovery"]);
  });

  it("does not repeat a label", () => {
    expect(
      searchCardLabels(
        {
          virtual_practice: false,
          in_person_practice: false,
          specialty_labels: ["ADHD", "ADHD"],
          insurance_labels: ["Aetna"],
        },
        ["ADHD", "Aetna"],
      ),
    ).toEqual(["ADHD", "Aetna"]);
  });
});
