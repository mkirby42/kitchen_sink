import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TherapistCard } from "@/components/search/TherapistCard";
import { ADMIN_ONLY_HIDDEN_LABEL } from "@/lib/therapists/listing";
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
    card_prompt: null,
    card_answer: null,
    card_tag: null,
    ...overrides,
  };
}

function chipLabels(html: string) {
  return [...html.matchAll(/<li class="[^"]*">([^<]*)<\/li>/g)].map(
    (match) => match[1],
  );
}

function render(
  overrides: Partial<SearchRow> = {},
  filterOverrides: Partial<SearchFilters> = {},
) {
  return renderToStaticMarkup(
    createElement(TherapistCard, {
      row: row(overrides),
      filters: { ...filters, ...filterOverrides },
    }),
  );
}

describe("Find therapist card", () => {
  it("shows name and credential without a rate or price", () => {
    const html = render();
    expect(html).toContain("Maya Chen");
    expect(html).toContain("LMFT");
    expect(html).toContain("Virtual");
    expect(html).not.toContain("$");
    expect(html).not.toContain("165");
    expect(html).not.toContain("75 min");
    expect(html).not.toContain("Sliding scale");
  });

  it("omits sliding scale even when the therapist offers it", () => {
    const html = render({ sliding_scale: true, min_price_cents: 8000 });
    expect(html).toContain("Maya Chen");
    expect(html).not.toContain("$");
    expect(html).not.toContain("Sliding scale");
  });

  it("lists only specialties and insurance that match the filters", () => {
    const html = render(
      {
        specialty_labels: ["Anxiety", "Trauma & PTSD"],
        insurance_labels: ["Aetna", "Cigna"],
        matched_labels: ["Anxiety", "Aetna"],
        match_count: 2,
      },
      { tags: ["Anxiety", "Depression", "Aetna"] },
    );
    expect(chipLabels(html)).toEqual(["Virtual", "Anxiety", "Aetna"]);
    expect(html).toContain("2 of 3 tags");
    expect(html).not.toContain("border-clay bg-clay");
  });

  it("shows a stored Teens specialty as Self Discovery", () => {
    const html = render(
      {
        specialty_labels: ["Teens"],
        matched_labels: ["Teens"],
        match_count: 1,
      },
      { tags: ["Self Discovery"] },
    );
    expect(chipLabels(html)).toEqual(["Virtual", "Self Discovery"]);
    expect(html).toContain("1 of 1 tag");
    expect(html).not.toContain("Teens");
  });

  it("omits specialty and insurance chips when those filters are empty", () => {
    const html = render({
      specialty_labels: ["Anxiety"],
      insurance_labels: ["Aetna"],
      virtual_practice: true,
    });
    expect(chipLabels(html)).toEqual(["Virtual"]);
  });

  it("badges an unlisted profile and leaves listed cards unmarked", () => {
    expect(render({ listed: false })).toContain(ADMIN_ONLY_HIDDEN_LABEL);
    expect(render()).not.toContain(ADMIN_ONLY_HIDDEN_LABEL);
    expect(render({ listed: true })).not.toContain(ADMIN_ONLY_HIDDEN_LABEL);
  });

  it("keeps a circular photo and no play control when there is no intro video", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    const html = render({ photo_key: "maya/photo.jpg", video_key: null });
    expect(html).toContain("rounded-full");
    expect(html).toContain("/object/public/photos/maya/photo.jpg");
    expect(html).not.toContain("Play intro video");
    expect(html).not.toContain("<video");
    expect(html).toContain('href="/t/11111111-1111-4111-8111-111111111111"');
    expect(html).not.toContain("aspect-[9/16]");
    expect(html).not.toContain("sm:flex-row");
  });

  it("shows a poster and play control without loading the video file", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    const html = render({
      photo_key: "maya/photo.jpg",
      video_key: "maya/intro.mp4",
    });
    const playAt = html.indexOf('aria-label="Play intro video for Maya Chen"');
    const linkAt = html.indexOf("<a ");
    expect(playAt).toBeGreaterThan(-1);
    expect(linkAt).toBeGreaterThan(playAt);
    expect(html.slice(0, linkAt)).not.toContain("<a ");
    expect(html).toContain("border-paper/80");
    expect(html).toContain("bg-transparent");
    expect(html).toContain("/object/public/photos/maya/photo.jpg");
    expect(html).not.toContain("intro.mp4");
    expect(html).not.toContain("<video");
    expect(html).not.toContain("autoPlay");
    expect(html).not.toContain("autoplay");
    expect(html).toContain('href="/t/11111111-1111-4111-8111-111111111111"');
    expect(html).toContain("aspect-[9/16]");
    expect(html).toContain("object-contain");
    expect(html).toContain("rounded-card");
    expect(html).toContain("shadow-card");
    expect(html.match(/<article[^>]*>/)?.[0]).not.toContain("border");
    expect(html).not.toContain("object-cover");
    expect(html).toContain("sm:flex-row");
    expect(html).toContain("sm:w-52");
    expect(html.match(/<article/g)).toHaveLength(1);
    const nameAt = html.indexOf(">Maya Chen<");
    expect(nameAt).toBeGreaterThan(playAt);
    expect(nameAt).toBeGreaterThan(linkAt);
  });

  it("shows the first conversation card and skips a blank one", () => {
    const withCard = render({
      card_prompt: "who I work best with...",
      card_answer: "College students and early-career professionals.",
      card_tag: "about",
    });
    expect(withCard).toContain("who I work best with...");
    expect(withCard).toContain("College students and early-career professionals.");
    expect(withCard).toContain("font-display text-[15px] text-clay italic");
    expect(withCard).toContain("text-[17px] leading-relaxed text-ink");
    expect(withCard.indexOf("who I work best with...")).toBeGreaterThan(
      withCard.indexOf("<a "),
    );

    const blank = render({
      card_prompt: "   ",
      card_answer: "unused",
    });
    expect(blank).not.toContain("unused");
  });
});
