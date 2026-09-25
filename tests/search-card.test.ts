import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TherapistCard } from "@/components/search/TherapistCard";
import type { SearchFilters, SearchRow } from "@/lib/search/rpc";

const filters: SearchFilters = {
  tags: [],
  virtual: false,
  inPerson: false,
  state: null,
};

function row(overrides: Partial<SearchRow> = {}): SearchRow {
  return {
    profile_id: "11111111-1111-4111-8111-111111111111",
    name: "Maya Chen",
    photo_key: null,
    credential: "LMFT",
    start_date_of_practice: "2017-01-01",
    min_price_cents: 16500,
    min_duration_minutes: 75,
    virtual_practice: true,
    in_person_practice: false,
    specialty_labels: ["Anxiety"],
    insurance_labels: [],
    match_count: 0,
    matched_labels: [],
    sliding_scale: false,
    ...overrides,
  };
}

function render(overrides: Partial<SearchRow> = {}) {
  return renderToStaticMarkup(
    createElement(TherapistCard, { row: row(overrides), filters }),
  );
}

describe("Find therapist card", () => {
  it("shows the starting rate as dollars and minutes", () => {
    const html = render();
    expect(html).toContain("$165");
    expect(html).toContain("75 min");
    expect(html).not.toContain("Sliding scale available");
  });

  it("shows a sliding scale indicator when offered", () => {
    const html = render({ sliding_scale: true });
    expect(html).toContain("75 min");
    expect(html).toContain("Sliding scale available");
  });
});
