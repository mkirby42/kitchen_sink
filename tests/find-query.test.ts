import { describe, expect, it } from "vitest";
import {
  buildFindHref,
  buildTherapistHref,
  filtersFromSearchParams,
  resultCountLabel,
} from "@/components/search/query";
import {
  normalizeSpecialtyFilterLabel,
  specialtyFilterChips,
} from "@/lib/tags/presets";

describe("find result copy", () => {
  it("keeps the plural s in one string so it cannot wrap", () => {
    expect(resultCountLabel(0)).toBe("0 therapists");
    expect(resultCountLabel(1)).toBe("1 therapist");
    expect(resultCountLabel(13)).toBe("13 therapists");
  });
});

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

  it("carries find filters onto a therapist profile so back can restore them", () => {
    const filters = {
      tags: ["Anxiety", "Aetna"],
      virtual: true,
      inPerson: false,
      state: "CA",
    };
    const href = buildTherapistHref("maya", filters);
    expect(href).toBe("/t/maya?tags=Anxiety%2CAetna&virtual=1&state=CA");

    const params = new URLSearchParams(href.split("?")[1]);
    expect(buildFindHref(filtersFromSearchParams(params))).toBe(
      "/find?tags=Anxiety%2CAetna&virtual=1&state=CA",
    );
  });

  it("keeps a bare therapist path when no filters are selected", () => {
    expect(
      buildTherapistHref("maya", {
        tags: [],
        virtual: false,
        inPerson: false,
        state: null,
      }),
    ).toBe("/t/maya");
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
