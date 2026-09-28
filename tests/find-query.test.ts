import { describe, expect, it } from "vitest";
import {
  buildFindHref,
  buildTherapistHref,
  filtersFromSearchParams,
  requestFindHref,
  resultCountLabel,
} from "@/components/search/query";
import { allowedSearchTags } from "@/lib/tags/presets";
import { parseFindSearchParams, searchRpcArgs } from "@/lib/search/rpc";

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

  it("drops free-text state and a symptom note, and keeps a state code", () => {
    const params = new URLSearchParams(
      "state=I%20have%20depression&tags=Anxiety",
    );
    expect(filtersFromSearchParams(params)).toEqual({
      tags: ["Anxiety"],
      virtual: false,
      inPerson: false,
      state: null,
    });
    expect(
      parseFindSearchParams({
        state: "ca",
        tags: "panic attacks,ADHD",
      }),
    ).toEqual({
      tags: ["ADHD"],
      virtual: false,
      inPerson: false,
      state: "CA",
    });
    expect(
      searchRpcArgs({
        tags: ["Anxiety", "my ptsd symptoms"],
        virtual: true,
        inPerson: false,
        state: "panic attacks in California",
      }),
    ).toEqual({
      p_tags: ["Anxiety"],
      p_virtual: true,
      p_in_person: false,
      p_state: null,
      p_limit: 24,
      p_offset: 0,
    });
    expect(
      requestFindHref({
        state: "I have depression",
        tags: "Anxiety",
      }),
    ).not.toBe(
      buildFindHref(
        parseFindSearchParams({
          state: "I have depression",
          tags: "Anxiety",
        }),
      ),
    );
    expect(requestFindHref({ state: "CA", tags: "Anxiety" })).toBe(
      "/find?tags=Anxiety&state=CA",
    );
  });

  it("drops a custom specialty tag and keeps preset filters", () => {
    const params = new URLSearchParams(
      "tags=Eating%20Disorders%2CADHD%2CAetna",
    );
    expect(filtersFromSearchParams(params).tags).toEqual(["ADHD", "Aetna"]);
    expect(
      parseFindSearchParams({
        tags: "Eating Disorders,ADHD,Aetna",
      }).tags,
    ).toEqual(["ADHD", "Aetna"]);
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

describe("search filter tags", () => {
  it("keeps specialty and insurance presets and drops custom labels", () => {
    expect(
      allowedSearchTags(["Aetna", "Eating Disorders", "ADHD", ""]),
    ).toEqual(["Aetna", "ADHD"]);
  });
});
