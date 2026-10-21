import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FindResultList } from "@/components/search/FindResultList";
import {
  browseStep,
  clampIndex,
  deskResultsClass,
  phoneBrowseKey,
  phoneBrowseRootClass,
  phoneScrollerClass,
  phoneSlideClass,
} from "@/lib/search/phone-browse";
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
    video_key: null,
    card_prompt: "who I work best with...",
    card_answer: "People who want a straight answer.",
    card_tag: "about",
    ...overrides,
  };
}

const travis = row({
  profile_id: "22222222-2222-4222-8222-222222222222",
  name: "Travis White",
  credential: "PsyD",
  photo_key: null,
  video_key: "travis/intro.mp4",
});

const ada = row({
  profile_id: "33333333-3333-4333-8333-333333333333",
  name: "Ada Lopez",
  credential: "LCSW",
});

function render(rows: SearchRow[], filterOverrides: Partial<SearchFilters> = {}) {
  return renderToStaticMarkup(
    createElement(FindResultList, {
      rows,
      filters: { ...filters, ...filterOverrides },
    }),
  );
}

function slice(html: string, startMarker: string, endMarker: string) {
  const start = html.indexOf(startMarker);
  const end = endMarker
    ? html.indexOf(endMarker, start + startMarker.length)
    : -1;
  return html.slice(start, end === -1 ? undefined : end);
}

describe("phone browse index", () => {
  it("stops at the ends", () => {
    expect(clampIndex(-3, 4)).toBe(0);
    expect(clampIndex(9, 4)).toBe(3);
    expect(clampIndex(1, 0)).toBe(0);
    expect(browseStep(0, 4, -1)).toBe(0);
    expect(browseStep(0, 4, 1)).toBe(1);
    expect(browseStep(3, 4, 1)).toBe(3);
    expect(browseStep(1, 1, 1)).toBe(0);
    expect(browseStep(1, 1, -1)).toBe(0);
  });

  it("changes the remount key when filters or the result ids change", () => {
    const ids = ["a", "b"];
    const base = phoneBrowseKey(filters, ids);
    expect(phoneBrowseKey(filters, ids)).toBe(base);
    expect(phoneBrowseKey({ ...filters, tags: ["Anxiety"] }, ids)).not.toBe(base);
    expect(phoneBrowseKey({ ...filters, virtual: true }, ids)).not.toBe(base);
    expect(phoneBrowseKey({ ...filters, inPerson: true }, ids)).not.toBe(base);
    expect(phoneBrowseKey({ ...filters, state: "CA" }, ids)).not.toBe(base);
    expect(phoneBrowseKey(filters, ["b", "a"])).not.toBe(base);
    expect(phoneBrowseKey(filters, ["a"])).not.toBe(base);
  });
});

describe("phone Find results", () => {
  it("keeps horizontal scrolling from trapping the page and leaves the desktop list stacked", () => {
    expect(phoneScrollerClass).toContain("overflow-x-auto");
    expect(phoneScrollerClass).toContain("snap-x");
    expect(phoneScrollerClass).toContain("snap-mandatory");
    expect(phoneScrollerClass).toContain("auto-cols-[100%]");
    expect(phoneScrollerClass).toContain("[touch-action:pan-x_pan-y]");
    expect(phoneScrollerClass).toContain("overflow-y-clip");
    expect(phoneScrollerClass).not.toContain("overflow-y-auto");
    expect(phoneScrollerClass).not.toContain("overflow-y-hidden");
    expect(phoneScrollerClass).not.toContain("touch-none");
    expect(phoneScrollerClass).not.toContain("touch-pan-x ");
    expect(phoneScrollerClass).not.toContain("h-screen");
    expect(phoneSlideClass).toContain("[scroll-snap-stop:always]");
    expect(phoneBrowseRootClass).toBe("md:hidden");
    expect(deskResultsClass).toContain("hidden");
    expect(deskResultsClass).toContain("md:block");
    expect(deskResultsClass).toContain("space-y-6");
  });

  it("shows one card at a time with a position, dots, and labeled previous/next buttons", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    const html = render([travis, row(), ada]);
    const phone = slice(html, 'data-phone-browse=""', 'data-find-results="desk"');
    const desk = slice(html, 'data-find-results="desk"', "");

    expect(phone).toContain(phoneBrowseRootClass);
    expect(phone).toContain(phoneScrollerClass);
    expect(phone).toContain('aria-roledescription="carousel"');
    expect(phone).toContain('aria-label="Previous therapist"');
    expect(phone).toContain('aria-label="Next therapist"');
    expect(phone).toContain("1 of 3");
    expect(phone).toContain("Travis White");
    expect(phone).toContain("Maya Chen");
    expect(phone).toContain("Ada Lopez");
    expect(phone.match(/size-2 rounded-full/g)).toHaveLength(3);
    expect(phone).toContain('data-phone-slide="active"');
    expect(phone).toContain('data-phone-slide="inactive"');
    expect(phone).toContain("inert");
    expect(phone).toContain('aria-label="Play intro video for Travis White"');
    expect(phone).toContain("who I work best with...");

    const active = slice(phone, 'data-phone-slide="active"', 'data-phone-slide="inactive"');
    expect(active).toContain("Travis White");
    expect(active).not.toContain("inert");

    expect(desk).toContain(deskResultsClass);
    expect(desk).toContain('data-find-card="desk"');
    expect(desk).toContain("Travis White");
    expect(desk).toContain("Maya Chen");
    expect(desk).not.toContain('aria-label="Previous therapist"');
  });

  it("renders a single therapist without a pager", () => {
    const html = render([row()]);
    const phone = slice(html, 'data-phone-browse=""', 'data-find-results="desk"');
    expect(phone).toContain("Maya Chen");
    expect(phone).toContain('data-phone-slide="active"');
    expect(phone).not.toContain("1 of 1");
    expect(phone).not.toContain("Previous therapist");
    expect(phone).not.toContain("Next therapist");
    expect(phone).not.toContain("inert");
    expect(html).toContain(deskResultsClass);
  });

  it("puts the filter set on the browse so a filter change can remount at the first card", () => {
    const open = render([travis, row()]);
    const anxiety = render([travis, row()], { tags: ["Anxiety"] });
    const openKey = open.match(/data-browse-key="([^"]*)"/)?.[1];
    const anxietyKey = anxiety.match(/data-browse-key="([^"]*)"/)?.[1];
    expect(openKey).toBeTruthy();
    expect(anxietyKey).toBeTruthy();
    expect(anxietyKey).not.toBe(openKey);
    expect(openKey).toBe(phoneBrowseKey(filters, [travis.profile_id, row().profile_id]));
  });
});
