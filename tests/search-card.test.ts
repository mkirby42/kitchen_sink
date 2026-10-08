import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TherapistCard } from "@/components/search/TherapistCard";
import { credentialTitle } from "@/lib/therapists/display";
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

function phone(html: string) {
  const start = html.indexOf('data-find-card="phone"');
  const end = html.indexOf('data-find-card="desk"');
  return html.slice(start, end === -1 ? undefined : end);
}

function desk(html: string) {
  const start = html.indexOf('data-find-card="desk"');
  return html.slice(start);
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
    expect(chipLabels(phone(html))).toEqual(["Virtual", "Anxiety", "Aetna"]);
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
    expect(chipLabels(phone(html))).toEqual(["Virtual", "Self Discovery"]);
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
    expect(phone(html)).not.toContain("object-cover");
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

  it("styles the desktop card like the wide mock and keeps the phone card", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    const html = render(
      {
        name: "Dr. Travis White",
        credential: "PsyD",
        photo_key: "travis/photo.jpg",
        video_key: "travis/intro.mp4",
        virtual_practice: true,
        in_person_practice: true,
        specialty_labels: ["Anxiety", "Trauma & PTSD"],
        insurance_labels: ["Aetna"],
        matched_labels: ["Anxiety"],
        match_count: 1,
        card_prompt: "who I work best with...",
        card_answer: "I help college students find their way.",
        card_tag: "about",
      },
      { tags: ["Anxiety"] },
    );
    const wide = desk(html);
    expect(wide).toContain("Dr. Travis White");
    expect(wide).toContain("PsyD · Licensed Psychologist");
    expect(wide).not.toContain("yrs");
    expect(wide).toContain("Watch Travis&#x27;s intro");
    expect(wide).toContain("Get to know Travis");
    expect(wide).toContain("→");
    expect(wide).toContain("who I work best with...");
    expect(wide).toContain("I help college students find their way.");
    expect(wide).toContain("✦");
    expect(wide).toContain("“");
    expect(wide).toContain("object-cover");
    expect(wide).toContain("1 of 1 tag");
    expect(wide).not.toContain("intro.mp4");
    expect(wide).not.toContain("<video");
    const tags = wide.slice(wide.indexOf('data-find-tags'));
    expect(chipLabels(tags)).toEqual(["Anxiety"]);
    expect(tags).not.toContain("Trauma");
    expect(tags).not.toContain("Aetna");
    const formats = wide.slice(
      wide.indexOf('data-find-formats'),
      wide.indexOf("who I work best with..."),
    );
    expect(formats).toContain("Virtual");
    expect(formats).toContain("In-Person");
    const watch = wide.indexOf("Watch Travis&#x27;s intro");
    const link = wide.indexOf("<a ");
    expect(watch).toBeGreaterThan(-1);
    expect(link).toBeGreaterThan(watch);
    expect(wide.slice(0, link)).not.toContain("<a ");
    expect(wide).toContain(
      'href="/t/11111111-1111-4111-8111-111111111111?tags=Anxiety"',
    );

    const narrow = phone(html);
    expect(narrow).toContain('aria-label="Play intro video for Dr. Travis White"');
    expect(narrow).toContain("aspect-[9/16]");
    expect(narrow).toContain("PsyD");
    expect(narrow).toContain("yrs");
    expect(narrow).not.toContain("Watch Travis&#x27;s intro");
    expect(narrow).not.toContain("Get to know Travis");
  });

  it("drops the desktop portrait when there is no photo or video", () => {
    const wide = desk(render({ photo_key: null, video_key: null }));
    expect(wide).not.toContain("Watch Maya's intro");
    expect(wide).not.toContain("object-cover");
    expect(wide).toContain("Get to know Maya");
    expect(wide).toContain("rounded-full");
    expect(wide).toContain("LMFT · Licensed Marriage and Family Therapist");
  });

  it("shows a desktop photo without a watch pill when there is no intro video", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    const wide = desk(
      render({ photo_key: "maya/photo.jpg", video_key: null, credential: "PhD" }),
    );
    expect(wide).toContain("object-cover");
    expect(wide).toContain("/object/public/photos/maya/photo.jpg");
    expect(wide).not.toContain("Watch Maya's intro");
    expect(wide).toContain(">PhD<");
    expect(wide).not.toContain("Licensed Psychologist");
  });
});

describe("credential titles", () => {
  it("expands the licensed codes the desktop card shows", () => {
    expect(credentialTitle("PsyD")).toBe("PsyD · Licensed Psychologist");
    expect(credentialTitle("LMFT")).toBe(
      "LMFT · Licensed Marriage and Family Therapist",
    );
    expect(credentialTitle("LCSW")).toBe("LCSW · Licensed Clinical Social Worker");
    expect(credentialTitle("LPC")).toBe("LPC · Licensed Professional Counselor");
    expect(credentialTitle("PhD")).toBe("PhD");
    expect(credentialTitle("MD")).toBe("MD");
    expect(credentialTitle("  ")).toBeNull();
    expect(credentialTitle(null)).toBeNull();
  });
});
