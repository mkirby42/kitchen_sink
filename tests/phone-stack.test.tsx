import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PhoneFilterSheet } from "@/components/search/PhoneFilterBar";
import { PhoneFind } from "@/components/search/PhoneFind";
import { PhoneProfileStack } from "@/components/search/PhoneProfileStack";
import { SWIPE_HINT } from "@/lib/search/phone-find";
import type { PhoneStackExtra } from "@/lib/search/phone-stack";
import type { SearchFilters, SearchRow } from "@/lib/search/rpc";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push() {} }),
  useSearchParams: () => new URLSearchParams(),
}));

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
    in_person_practice: true,
    specialty_labels: ["Anxiety"],
    insurance_labels: ["Aetna", "Out-of-Network Superbill"],
    match_count: 0,
    matched_labels: [],
    sliding_scale: false,
    video_key: null,
    card_prompt: "who I work best with...",
    card_answer: "College students and early-career professionals.",
    card_tag: "about",
    ...overrides,
  };
}

const travis = row({
  profile_id: "22222222-2222-4222-8222-222222222222",
  name: "Travis White",
  credential: "PsyD",
  photo_key: "travis/photo.jpg",
  video_key: "travis/intro.mp4",
  insurance_labels: ["Aetna"],
});

function extra(id: string, overrides: Partial<PhoneStackExtra> = {}): PhoneStackExtra {
  return {
    id,
    cards: [
      {
        prompt: "who I work best with...",
        answer: "College students and early-career professionals.",
      },
      { prompt: "a session with me feels like...", answer: "Two people talking." },
    ],
    licenseStates: ["TX"],
    superbill: true,
    contact: [
      {
        kind: "email",
        label: "Email",
        href: "mailto:travis@example.com",
        value: "travis@example.com",
      },
      {
        kind: "phone",
        label: "Call",
        href: "tel:+15125550199",
        value: "(512) 555-0199",
      },
      {
        kind: "text",
        label: "Text",
        href: "sms:+15125550199",
        value: "(512) 555-0199",
      },
    ],
    rates: [
      { service_type: "Individual", duration_minutes: 55, price_cents: 15000 },
    ],
    ...overrides,
  };
}

describe("phone Find list", () => {
  it("lists compact cards, web filter pills, and the one-at-a-time toggle", () => {
    const html = renderToStaticMarkup(
      createElement(PhoneFind, { rows: [travis, row()], extras: [] }),
    );
    expect(html).toContain('data-phone-mode="list"');
    expect(html).toContain("Find your therapist");
    expect(html).toContain("Where you live");
    expect(html).toContain("What&#x27;s going on");
    expect(html).toContain("In person or online");
    expect(html).not.toContain("Years in practice");
    expect(html).toContain("2 therapists fit");
    expect(html).toContain("One at a time");
    expect(html).toContain("Travis White");
    expect(html).toContain("Maya Chen");
    expect(html).toContain("PsyD · Licensed psychologist");
    expect(html).not.toContain("1 of 2");
    expect(html).not.toContain("Previous therapist");
    expect(html).not.toContain("$");
    expect(html).not.toContain("0:30");
  });

  it("does not call a failed search zero matches", () => {
    const html = renderToStaticMarkup(
      createElement(PhoneFind, { rows: null, extras: [] }),
    );
    expect(html).toContain("Therapist search isn&#x27;t available right now.");
    expect(html).not.toContain("therapists fit");
    expect(html).not.toContain("One at a time");
  });

  it("still offers one at a time when a single therapist is listed", () => {
    const html = renderToStaticMarkup(
      createElement(PhoneFind, { rows: [row()], extras: [] }),
    );
    expect(html).toContain("1 therapist fits");
    expect(html).toContain("One at a time");
    expect(html).not.toContain("1 of 1");
  });
});

describe("phone profile stack", () => {
  it("swipes between profiles and pins a consult when an email is listed", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    const html = renderToStaticMarkup(
      createElement(PhoneProfileStack, {
        rows: [travis, row()],
        extras: [extra(travis.profile_id), extra(row().profile_id, { superbill: false, contact: [], rates: [] })],
        filters,
        onBack() {},
      }),
    );
    expect(html).toContain("All 2");
    expect(html).toContain("1 of 2");
    expect(html).toContain(SWIPE_HINT);
    expect(html).toContain("Swipe for 2 of 2");
    expect(html).toContain('aria-label="Previous therapist"');
    expect(html).toContain('aria-label="Next therapist"');
    expect(html).toContain("auto-cols-[86%]");
    expect(html).toContain("[touch-action:pan-x_pan-y]");
    expect(html).toContain("Watch intro");
    expect(html).not.toContain("0:30");
    expect(html).not.toContain("intro.mp4");
    expect(html).toContain("I WORK BEST WITH...");
    expect(html).toContain("a session with me feels like...");
    expect(html).toContain("Licensed in Texas");
    expect(html).toContain("Book a free consult");
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).not.toContain("mailto:");
    expect(html).not.toContain("tel:");
    expect(html).not.toContain("15-min");
    expect(html).toContain("Individual session (55 min)");
    expect(html).toContain("Paying yourself? Get reimbursed later");
    expect(html).not.toContain("$165");
  });

  it("omits swipe chrome, booking, and fees when that data is absent", () => {
    const html = renderToStaticMarkup(
      createElement(PhoneProfileStack, {
        rows: [row({ start_date_of_practice: null, insurance_labels: [], card_prompt: null, card_answer: null })],
        extras: [],
        filters,
        onBack() {},
      }),
    );
    expect(html).toContain("All 1");
    expect(html).not.toContain("1 of 1");
    expect(html).not.toContain(SWIPE_HINT);
    expect(html).not.toContain("Swipe for");
    expect(html).not.toContain("Book a free consult");
    expect(html).not.toContain("Book a session");
    expect(html).not.toContain("Fees");
    expect(html).not.toContain("Paying yourself");
    expect(html).not.toContain(" yrs");
  });
});

describe("phone filter sheet", () => {
  it("uses the web help-with wording and a live show button", () => {
    const html = renderToStaticMarkup(
      createElement(PhoneFilterSheet, {
        sheet: "topics",
        filters,
        matchCount: 3,
        onApply() {},
        onClose() {},
      }),
    );
    expect(html).toContain("What would you like help with?");
    expect(html).toContain("Pick anything that sounds like you.");
    expect(html).toContain("clinical term");
    expect(html).toContain("small print");
    expect(html).toContain("Feeling down or stuck");
    expect(html).toContain("Depression");
    expect(html).toContain("Worry, stress or panic");
    expect(html).toContain("Anxiety, panic disorder");
    expect(html).toContain("Something hard happened");
    expect(html).toContain("Losing someone");
    expect(html).toContain("Relationship trouble");
    expect(html).toContain("Big life changes");
    expect(html).toContain("Trouble focusing");
    expect(html).not.toContain("Self discovery");
    expect(html).not.toContain("Family or parenting");
    expect(html).toContain("Clear all");
    expect(html).toContain("Show 3 therapists");
  });
});
