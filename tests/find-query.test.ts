import { describe, expect, it } from "vitest";
import {
  buildFindHref,
  filtersFromSearchParams,
} from "@/components/search/query";
import {
  normalizeSpecialtyFilterLabel,
  specialtyFilterChips,
} from "@/lib/tags/presets";

describe("find search URL", () => {
  it("encodes tags as a comma-separated query param", () => {
    expect(
      buildFindHref({
        tags: ["ADHD", "Aetna"],
        virtual: false,
        inPerson: false,
        state: null,
      }),
    ).toBe("/find?tags=ADHD%2CAetna");
  });

  it("encodes session format flags and license state", () => {
    expect(
      buildFindHref({
        tags: [],
        virtual: true,
        inPerson: true,
        state: "CA",
      }),
    ).toBe("/find?virtual=1&in_person=1&state=CA");
  });

  it("returns a bare /find path when filters are empty", () => {
    expect(
      buildFindHref({
        tags: [],
        virtual: false,
        inPerson: false,
        state: null,
      }),
    ).toBe("/find");
  });

  it("reads the same query keys back into filters", () => {
    const params = new URLSearchParams("tags=Anxiety&virtual=1&state=CA");
    expect(filtersFromSearchParams(params)).toEqual({
      tags: ["Anxiety"],
      virtual: true,
      inPerson: false,
      state: "CA",
    });
  });

  it("round-trips a custom specialty tag", () => {
    const href = buildFindHref({
      tags: ["Eating Disorders"],
      virtual: false,
      inPerson: false,
      state: null,
    });
    const params = new URLSearchParams(href.split("?")[1]);
    expect(filtersFromSearchParams(params).tags).toEqual(["Eating Disorders"]);
  });
});

describe("custom specialty search chips", () => {
  it("trims and maps a typed preset to the canonical chip", () => {
    expect(normalizeSpecialtyFilterLabel("  adhd  ")).toBe("ADHD");
  });

  it("keeps a new specialty label after trim", () => {
    expect(normalizeSpecialtyFilterLabel("  Eating  Disorders  ")).toBe(
      "Eating Disorders",
    );
  });

  it("rejects blank input", () => {
    expect(normalizeSpecialtyFilterLabel("   ")).toBeNull();
  });

  it("lists custom selected specialties after presets", () => {
    expect(specialtyFilterChips(["Aetna", "Eating Disorders", "ADHD"])).toEqual([
      "Anxiety",
      "Depression",
      "Trauma & PTSD",
      "Couples & Relationships",
      "ADHD",
      "Grief & Loss",
      "Life Transitions",
      "Teens",
      "Immigration",
      "Eating Disorders",
    ]);
  });
});
