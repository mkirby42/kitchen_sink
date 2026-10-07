import { describe, expect, it } from "vitest";
import {
  buildFindHref,
  buildTherapistHref,
  filtersFromSearchParams,
  requestFindHref,
  resultCountLabel,
} from "@/components/search/query";
import { allowedSearchTags } from "@/lib/tags/presets";
import {
  normalizeSearchRows,
  parseFindSearchParams,
  searchRpcArgs,
  type SearchRow,
} from "@/lib/search/rpc";

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

  it("reads a Teens link as the Self Discovery filter", () => {
    expect(allowedSearchTags(["Teens", "Self Discovery", "Aetna"])).toEqual([
      "Self Discovery",
      "Aetna",
    ]);
    expect(parseFindSearchParams({ tags: "Teens,Aetna" })).toEqual({
      tags: ["Self Discovery", "Aetna"],
      virtual: false,
      inPerson: false,
      state: null,
    });
    expect(requestFindHref({ tags: "Teens" })).toBe("/find?tags=Teens");
    expect(buildFindHref(parseFindSearchParams({ tags: "Teens" }))).toBe(
      "/find?tags=Self+Discovery",
    );
  });

  it("asks the match query for Teens when Self Discovery is selected", () => {
    expect(
      searchRpcArgs({
        tags: ["Self Discovery", "Aetna"],
        virtual: false,
        inPerson: false,
        state: null,
      }).p_tags,
    ).toEqual(["Self Discovery", "Aetna", "Teens"]);
  });
});

function searchRow(overrides: Partial<SearchRow> = {}): SearchRow {
  return {
    profile_id: "11111111-1111-4111-8111-111111111111",
    name: "Zoe",
    photo_key: null,
    credential: null,
    start_date_of_practice: null,
    min_price_cents: null,
    min_duration_minutes: null,
    virtual_practice: false,
    in_person_practice: false,
    specialty_labels: [],
    insurance_labels: [],
    match_count: 0,
    matched_labels: [],
    sliding_scale: false,
    video_key: null,
    card_prompt: null,
    card_answer: null,
    card_tag: null,
    ...overrides,
  };
}

describe("legacy specialty label", () => {
  it("shows a stored Teens tag as Self Discovery and counts it once", () => {
    const [row] = normalizeSearchRows(
      [
        searchRow({
          specialty_labels: ["Teens", "Self Discovery", "Anxiety"],
          matched_labels: ["Teens", "Self Discovery"],
          match_count: 2,
        }),
      ],
      ["Self Discovery"],
    );
    expect(row.specialty_labels).toEqual(["Self Discovery", "Anxiety"]);
    expect(row.matched_labels).toEqual(["Self Discovery"]);
    expect(row.match_count).toBe(1);
  });

  it("re-ranks when collapsing Teens changes the overlap count", () => {
    const rows = normalizeSearchRows(
      [
        searchRow({
          profile_id: "22222222-2222-4222-8222-222222222222",
          name: "Zoe",
          specialty_labels: ["Teens", "Self Discovery"],
          matched_labels: ["Teens", "Self Discovery"],
          match_count: 2,
        }),
        searchRow({
          name: "Amy",
          specialty_labels: ["Self Discovery"],
          matched_labels: ["Self Discovery"],
          match_count: 1,
        }),
      ],
      ["Self Discovery"],
    );
    expect(rows.map((row) => row.name)).toEqual(["Amy", "Zoe"]);
    expect(rows.map((row) => row.match_count)).toEqual([1, 1]);
  });

  it("keeps SQL order when the overlap count does not change", () => {
    const rows = normalizeSearchRows(
      [
        searchRow({ name: "Zoe", match_count: 1, matched_labels: ["Anxiety"] }),
        searchRow({
          profile_id: "22222222-2222-4222-8222-222222222222",
          name: "Amy",
          match_count: 0,
          matched_labels: [],
        }),
      ],
      ["Anxiety"],
    );
    expect(rows.map((row) => row.name)).toEqual(["Zoe", "Amy"]);
  });
});
