import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PhoneProfileColumn } from "@/components/profile/PhoneProfileColumn";
import { PhoneFilterSheet } from "@/components/search/PhoneFilterBar";
import { PhoneFind } from "@/components/search/PhoneFind";
import { PhoneProfileStack } from "@/components/search/PhoneProfileStack";
import { SWIPE_HINT } from "@/lib/search/phone-find";
import type { PhoneStackBooking } from "@/lib/search/phone-stack";
import type { ReviewViewer } from "@/lib/reviews/viewer";
import type { SearchFilters, SearchRow } from "@/lib/search/rpc";
import {
  consultBookActions,
  type TherapistProfileData,
} from "@/lib/therapists/load";

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

const visitor: ReviewViewer = {
  userId: null,
  role: null,
  isOwner: false,
};

function profile(
  id: string,
  overrides: Partial<TherapistProfileData> = {},
): TherapistProfileData {
  return {
    id,
    name: "Travis White",
    givenName: "Travis",
    email: "travis@example.com",
    phone: "(512) 555-0199",
    about: "I help people find their way.",
    photoUrl: "https://example.com/photo.jpg",
    videoUrl: "https://example.com/intro.mp4",
    voiceUrl: null,
    voicePrompt: null,
    credential: "PsyD",
    years: 8,
    virtual: true,
    inPerson: true,
    office: {
      address: "1102 West 6th Street, Austin",
      address2: null,
      state: "TX",
      zip: "78703",
    },
    education: ["Doctor of Clinical Psychology"],
    credentials: ["Licensed Psychologist"],
    slidingScale: false,
    slidingScaleMinCents: null,
    slidingScaleMaxCents: null,
    superbill: true,
    licenses: [{ number: "38047", state: "TX" }],
    rates: [
      { service_type: "Individual", duration_minutes: 55, price_cents: 15000 },
    ],
    tags: [],
    specialties: ["Anxiety"],
    modalities: ["CBT"],
    insurance: ["Aetna", "Out-of-Network Superbill"],
    inNetwork: ["Aetna"],
    identity: [],
    cards: [
      {
        prompt: "a session with me feels like...",
        answer: "It is just two people talking.",
        tag: "session_vibe",
      },
    ],
    reviews: [],
    pendingReview: null,
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
    ],
    openToNewClients: true,
    ...overrides,
  };
}

function bookingFor(data: TherapistProfileData): PhoneStackBooking {
  return {
    id: data.id,
    givenName: data.givenName,
    actions: consultBookActions(data.contact),
    contact: data.contact,
  };
}

function column(data: TherapistProfileData) {
  return createElement(PhoneProfileColumn, {
    key: data.id,
    data,
    viewer: visitor,
    showContact: false,
  });
}

describe("phone Find list", () => {
  it("lists compact cards, web filter pills, and the one-at-a-time toggle", () => {
    const html = renderToStaticMarkup(
      createElement(PhoneFind, {
        rows: [travis, row()],
        booking: [],
        slides: null,
      }),
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
      createElement(PhoneFind, { rows: null, booking: [], slides: null }),
    );
    expect(html).toContain("Therapist search isn&#x27;t available right now.");
    expect(html).not.toContain("therapists fit");
    expect(html).not.toContain("One at a time");
  });

  it("still offers one at a time when a single therapist is listed", () => {
    const html = renderToStaticMarkup(
      createElement(PhoneFind, { rows: [row()], booking: [], slides: null }),
    );
    expect(html).toContain("1 therapist fits");
    expect(html).toContain("One at a time");
    expect(html).not.toContain("1 of 1");
  });
});

describe("phone profile stack", () => {
  it("renders the opened phone profile and pins both booking buttons", () => {
    const travisProfile = profile(travis.profile_id);
    const maya = profile(row().profile_id, {
      name: "Maya Chen",
      givenName: "Maya",
      contact: [],
    });
    const html = renderToStaticMarkup(
      <PhoneProfileStack
        rows={[travis, row()]}
        booking={[bookingFor(travisProfile), bookingFor(maya)]}
        onBack={() => {}}
      >
        {column(travisProfile)}
        {column(maya)}
      </PhoneProfileStack>,
    );
    expect(html).toContain("All 2");
    expect(html).toContain("1 of 2");
    expect(html).toContain(SWIPE_HINT);
    expect(html).toContain("Swipe for 2 of 2");
    expect(html).toContain('aria-label="Previous therapist"');
    expect(html).toContain('aria-label="Next therapist"');
    expect(html).toContain("auto-cols-[86%]");
    expect(html).toContain("[touch-action:pan-x_pan-y]");
    expect(html.match(/data-phone-profile-column/g)).toHaveLength(2);
    expect(html).toContain('data-hero-variant="overlay"');
    expect(html).toContain("Play intro video for Travis White");
    expect(html).toContain(">Travis White</h1>");
    expect(html).toContain("Licensed by State of Texas / 38047");
    expect(html).toContain("How Travis works");
    expect(html).toContain("Get to know Travis");
    expect(html).toContain("a session with me feels like...");
    expect(html).toContain("Approach in therapy");
    expect(html).toContain("Areas of interest");
    expect(html).toContain("own words");
    expect(html).toContain('data-cta-placement="dock"');
    expect(html.match(/data-cta-placement="dock"/g)).toHaveLength(1);
    expect(html).toContain("Free consult");
    expect(html).toContain("Book a session");
    expect(html).not.toContain("Book a free consult");
    expect(html).not.toContain("Watch intro");
    expect(html).not.toContain("I WORK BEST WITH...");
    expect(html).not.toContain("intro.mp4");
    expect(html).not.toContain("15-min");
    expect(html).not.toContain("$165");
  });

  it("omits swipe chrome and both buttons when there is nothing to book or swipe", () => {
    const solo = profile(row().profile_id, {
      name: "Maya Chen",
      givenName: "Maya",
      contact: [],
      videoUrl: null,
      about: null,
      education: [],
      credentials: [],
      cards: [],
      rates: [],
      insurance: [],
      inNetwork: [],
      modalities: [],
      specialties: [],
      licenses: [],
      years: null,
    });
    const html = renderToStaticMarkup(
      <PhoneProfileStack
        rows={[row({ card_prompt: null, card_answer: null })]}
        booking={[bookingFor(solo)]}
        onBack={() => {}}
      >
        {column(solo)}
      </PhoneProfileStack>,
    );
    expect(html).toContain("All 1");
    expect(html).toContain("Maya Chen");
    expect(html).toContain('data-phone-profile-column=""');
    expect(html).not.toContain("1 of 1");
    expect(html).not.toContain(SWIPE_HINT);
    expect(html).not.toContain("Swipe for");
    expect(html).not.toContain("Free consult");
    expect(html).not.toContain("Book a session");
    expect(html).not.toContain("Book a free consult");
    expect(html).not.toContain('data-cta-placement="dock"');
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
