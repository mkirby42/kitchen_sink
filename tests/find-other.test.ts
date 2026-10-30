import { describe, expect, it } from "vitest";
import {
  applyFindOtherMatches,
  hasUnlistedFindTopic,
  hasUnlistedInsurance,
  type FindOtherRow,
} from "@/lib/search/find-other";

function row(overrides: Partial<FindOtherRow> = {}): FindOtherRow {
  return {
    name: "Zoe",
    specialty_labels: [],
    insurance_labels: [],
    match_count: 0,
    matched_labels: [],
    ...overrides,
  };
}

describe("Find Other matching", () => {
  it("treats a label outside the insurance presets as insurance Other", () => {
    expect(hasUnlistedInsurance(["Aetna"])).toBe(false);
    expect(hasUnlistedInsurance(["Cash Pay Only"])).toBe(false);
    expect(hasUnlistedInsurance(["United"])).toBe(true);
    expect(hasUnlistedInsurance(["Aetna", "United"])).toBe(true);
    expect(hasUnlistedInsurance(["Other"])).toBe(true);
  });

  it("treats a specialty outside the twelve named topics as topic Other", () => {
    expect(hasUnlistedFindTopic(["Depression", "Anxiety"])).toBe(false);
    expect(hasUnlistedFindTopic(["Self Discovery"])).toBe(false);
    expect(hasUnlistedFindTopic(["Teens"])).toBe(false);
    expect(hasUnlistedFindTopic(["Bipolar & Mood Disorders"])).toBe(false);
    expect(hasUnlistedFindTopic(["Eating Disorders & Body Image"])).toBe(false);
    expect(hasUnlistedFindTopic(["Autism & Neurodivergence"])).toBe(false);
    expect(hasUnlistedFindTopic(["Psychological Testing & Assessment"])).toBe(false);
    expect(hasUnlistedFindTopic(["Immigration"])).toBe(true);
    expect(hasUnlistedFindTopic(["Eating Disorders"])).toBe(true);
    expect(hasUnlistedFindTopic(["Other"])).toBe(true);
    expect(hasUnlistedFindTopic(["ADHD", "Immigration"])).toBe(true);
  });

  it("leaves a named-tag page alone when Other is not selected", () => {
    const rows = [row({ name: "Zoe", specialty_labels: ["Depression"] })];
    expect(applyFindOtherMatches(rows, ["Anxiety"])).toEqual(rows);
  });

  it("ORs a named insurance plan with unlisted insurance", () => {
    const rows = [
      row({ name: "Aetna only", insurance_labels: ["Aetna"] }),
      row({ name: "United only", insurance_labels: ["United"] }),
      row({ name: "BCBS only", insurance_labels: ["BCBS"] }),
      row({ name: "Literal", insurance_labels: ["Other"] }),
      row({ name: "Preset plus custom", insurance_labels: ["Aetna", "United"] }),
    ];
    expect(applyFindOtherMatches(rows, ["Other"]).map((item) => item.name)).toEqual([
      "Literal",
      "Preset plus custom",
      "United only",
    ]);
    expect(applyFindOtherMatches(rows, ["Aetna", "Other"]).map((item) => item.name)).toEqual([
      "Preset plus custom",
      "Aetna only",
      "Literal",
      "United only",
    ]);
    const both = applyFindOtherMatches(rows, ["Aetna", "Other"]).find(
      (item) => item.name === "Preset plus custom",
    );
    expect(both?.matched_labels).toEqual(["Aetna", "Other"]);
    expect(both?.match_count).toBe(2);
  });

  it("ORs a named topic with a specialty outside the twelve", () => {
    const rows = [
      row({ name: "Depression only", specialty_labels: ["Depression"] }),
      row({ name: "Immigration", specialty_labels: ["Immigration"] }),
      row({ name: "Custom", specialty_labels: ["Eating Disorders"] }),
      row({ name: "Teens", specialty_labels: ["Teens"] }),
      row({ name: "Literal", specialty_labels: ["Other"] }),
      row({ name: "Anxiety", specialty_labels: ["Anxiety"] }),
    ];
    expect(applyFindOtherMatches(rows, ["Other topic"]).map((item) => item.name)).toEqual([
      "Custom",
      "Immigration",
      "Literal",
    ]);
    expect(
      applyFindOtherMatches(rows, ["Depression", "Other topic"]).map((item) => item.name),
    ).toEqual(["Custom", "Depression only", "Immigration", "Literal"]);
  });

  it("does not let insurance Other match a topic, or topic Other match a plan", () => {
    const rows = [
      row({ name: "United", insurance_labels: ["United"] }),
      row({ name: "Immigration", specialty_labels: ["Immigration"] }),
    ];
    expect(applyFindOtherMatches(rows, ["Other"]).map((item) => item.name)).toEqual([
      "United",
    ]);
    expect(applyFindOtherMatches(rows, ["Other topic"]).map((item) => item.name)).toEqual([
      "Immigration",
    ]);
    expect(
      applyFindOtherMatches(rows, ["Other", "Other topic"]).map((item) => item.name),
    ).toEqual(["Immigration", "United"]);
  });

  it("ranks a draft ahead of a closer live overlap", () => {
    const rows = applyFindOtherMatches(
      [
        row({
          name: "Live",
          insurance_labels: ["Aetna", "United"],
          published: true,
          listed: true,
        }),
        row({
          name: "Draft",
          insurance_labels: ["United"],
          published: false,
          listed: false,
        }),
      ],
      ["Aetna", "Other"],
    );
    expect(rows.map((item) => item.name)).toEqual(["Draft", "Live"]);
    expect(rows[1]?.match_count).toBe(2);
  });
});
