// Product-decision guard. Do not weaken this file to make CI pass.
// See docs/product-decisions.md.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PhoneFind } from "@/components/search/PhoneFind";
import { PhoneProfileStack } from "@/components/search/PhoneProfileStack";
import { TherapistCardPhone } from "@/components/search/TherapistCardPhone";
import type { SearchFilters, SearchRow } from "@/lib/search/rpc";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push() {} }),
  useSearchParams: () => new URLSearchParams(),
}));

const filters: SearchFilters = {
  tags: ["Aetna"],
  virtual: false,
  inPerson: false,
  state: null,
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

describe("phone find guards", () => {
  afterEach(() => {
    vi.useRealTimers();
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  });

  it("lists by default under Find your therapist", () => {
    const html = renderToStaticMarkup(
      createElement(PhoneFind, {
        rows: [row(1), row(2)],
        booking: [],
        slides: createElement("div", null, "slides"),
      }),
    );
    expect(html).toContain("Find your therapist");
    expect(html).toContain("2 therapists fit");
    expect(html).toContain("List");
    expect(html).toContain("One at a time");
    expect(html).toContain('data-phone-mode="list"');
    expect(html).toContain("What&#x27;s going on");
    expect(html).not.toContain("What brings you to therapy?");
    expect(html).not.toContain('data-phone-stack=""');
  });

  it("plays a vertical intro in the tall list frame and leaves price off it", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    const html = renderToStaticMarkup(
      createElement(TherapistCardPhone, {
        row: row(1, { photo_key: "a.jpg", video_key: "b.mp4" }),
        filters,
      }),
    );
    expect(html).toContain("aspect-[4/5]");
    expect(html).toContain("mx-auto aspect-[4/5] w-full max-w-md");
    expect(html).toContain("In person · Online");
    expect(html).toContain("Therapist 01");
    expect(html).toContain("PsyD · Licensed psychologist");
    expect(html).toContain("I work best with...");
    expect(html).toContain("College students finding their way.");
    expect(html).toContain("Play intro video for Therapist 01");
    expect(html).toContain('aria-label="Get to know Therapist"');
    expect(html).not.toContain("Takes Aetna");
    expect(html).not.toContain("yrs");
    expect(html).not.toContain("$150");
    expect(html).not.toContain("Anxiety");
    expect(html).not.toContain("1 of 1 tag");
    expect(html).not.toContain("Sliding");
  });

  it("shows Takes and years on the initials card, still with no price", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-22T12:00:00Z"));
    const html = renderToStaticMarkup(
      createElement(TherapistCardPhone, { row: row(1), filters }),
    );
    expect(html).toContain('aria-label="Get to know Therapist"');
    expect(html).toContain("In person · Online");
    expect(html).toContain("PsyD · Licensed psychologist");
    expect(html).toContain("I work best with...");
    expect(html).toContain("Takes Aetna");
    expect(html).toContain("9 yrs");
    expect(html).not.toContain("$150");
    expect(html).not.toContain("55 min");
    expect(html).not.toContain("Anxiety");
    expect(html).not.toContain("1 of 1 tag");
    expect(html).not.toContain("aspect-[4/5]");
  });

  it("swipes through the phone profile one at a time", () => {
    const html = renderToStaticMarkup(
      <PhoneProfileStack
        rows={[row(1), row(2)]}
        booking={[]}
        onBack={() => {}}
      >
        <div>Profile one</div>
        <div>Profile two</div>
      </PhoneProfileStack>,
    );
    expect(html).toContain("All 2");
    expect(html).toContain("1 of 2");
    expect(html).toContain("Swipe for the next therapist");
    expect(html).toContain("Swipe for 2 of 2");
    expect(html).toContain("Therapist 02");
    expect(html).toContain("Profile one");
  });
});
