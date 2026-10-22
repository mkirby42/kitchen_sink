// Product-decision guard. Do not weaken this file to make CI pass.
// See docs/product-decisions.md.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FindDesktopResults } from "@/components/search/FindDesktopResults";
import { FindDirectoryCard } from "@/components/search/FindDirectoryCard";
import type { SearchFilters, SearchRow } from "@/lib/search/rpc";

const filters: SearchFilters = {
  tags: ["Aetna"],
  virtual: false,
  inPerson: false,
  state: "TX",
};

function row(index: number, overrides: Partial<SearchRow> = {}): SearchRow {
  const n = String(index).padStart(2, "0");
  return {
    profile_id: `00000000-0000-4000-8000-0000000000${n}`,
    name: `Therapist ${n}`,
    photo_key: null,
    credential: "PsyD",
    start_date_of_practice: "2017-01-01",
    min_price_cents: 15000,
    min_duration_minutes: 55,
    virtual_practice: true,
    in_person_practice: true,
    specialty_labels: ["Anxiety"],
    insurance_labels: ["Aetna", "Out-of-Network Superbill"],
    match_count: 1,
    matched_labels: ["Aetna"],
    sliding_scale: true,
    video_key: null,
    card_prompt: "I work best with...",
    card_answer: "College students finding their way.",
    card_tag: "about",
    ...overrides,
  };
}

function results(count: number, layout: "grid" | "one") {
  const rows = Array.from({ length: count }, (_, i) => row(i + 1));
  return renderToStaticMarkup(
    createElement(FindDesktopResults, {
      rows,
      filters,
      view: { layout, more: 0, therapistId: null },
      detail: null,
    }),
  );
}

describe("desktop find card guards", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("pages a grid of eight and names the real remainder", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-22T12:00:00Z"));
    const nine = results(9, "grid");
    expect(nine).toContain("9 therapists fit what you told us");
    expect(nine).toContain("Click anyone to see their full profile");
    expect(nine).toContain("Show 1 more");
    expect(nine).toContain("Grid");
    expect(nine).toContain("One at a time");
    expect(nine.match(/data-find-card="grid"/g)).toHaveLength(8);
    expect(nine).toContain("lg:grid-cols-4");
    expect(nine).toContain("grid-cols-2");

    const sixteen = results(16, "grid");
    expect(sixteen).toContain("Show 8 more");
    expect(sixteen.match(/data-find-card="grid"/g)).toHaveLength(8);
  });

  it("keeps price, specialty pills, and the match count off the card", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-22T12:00:00Z"));
    const html = renderToStaticMarkup(
      createElement(FindDirectoryCard, {
        row: row(1),
        filters,
        view: { layout: "grid" },
      }),
    );
    expect(html).toContain("Therapist 01");
    expect(html).toContain("PsyD · Licensed psychologist");
    expect(html).toContain("I work best with...");
    expect(html).toContain("College students finding their way.");
    expect(html).toContain("Takes Aetna");
    expect(html).toContain("9 yrs in practice");
    expect(html).not.toContain("$150");
    expect(html).not.toContain("55 min");
    expect(html).not.toContain("Sliding");
    expect(html).not.toContain("Available");
    expect(html).not.toContain("Anxiety");
    expect(html).not.toContain("Can help with");
    expect(html).not.toContain("1 of 1 tag");
  });

  it("uses that same card for one at a time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-22T12:00:00Z"));
    const html = results(2, "one");
    expect(html).toContain('data-find-layout="one"');
    expect(html).toContain("Therapist 1 of 2 who fit what you told us");
    expect(html).toContain("max-w-lg");
    expect(html).toContain("Takes Aetna");
    expect(html).toContain("College students finding their way.");
    expect(html).not.toContain("Get to know");
    expect(html).not.toContain("Can help with");
    expect(html).not.toContain("$150");
    expect(html).not.toContain("1 of 1 tag");
    expect(html).not.toContain("Anxiety");
  });
});
