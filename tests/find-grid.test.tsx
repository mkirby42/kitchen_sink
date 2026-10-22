import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FindDesktopResults } from "@/components/search/FindDesktopResults";
import {
  buildFindDetail,
  detailConsult,
  splitDetailCards,
  type FindDetailProfile,
} from "@/lib/search/find-detail";
import {
  gridFitLine,
  gridShowMoreLabel,
  gridVisibleCount,
  gridYearsLabel,
  takesInsuranceLine,
} from "@/lib/search/find-grid";
import type { SearchFilters, SearchRow } from "@/lib/search/rpc";
import { yearsPracticing } from "@/lib/therapists/display";

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
    video_key: index === 1 ? "videos/intro.mp4" : null,
    card_prompt: "I work best with...",
    card_answer: "College students finding their way.",
    card_tag: "about",
    ...overrides,
  };
}

function results(
  count: number,
  view: { layout?: "grid" | "one"; more?: number; therapistId?: string | null } = {},
  detail: ReturnType<typeof buildFindDetail> | null = null,
) {
  const rows = Array.from({ length: count }, (_, i) => row(i + 1));
  return renderToStaticMarkup(
    createElement(FindDesktopResults, {
      rows,
      filters,
      view: {
        layout: view.layout ?? "grid",
        more: view.more ?? 0,
        therapistId: view.therapistId ?? null,
      },
      detail,
    }),
  );
}

describe("desktop find grid", () => {
  const now = new Date("2026-10-22T12:00:00Z");

  it("pages by 8 and names the real remainder", () => {
    expect(gridVisibleCount(9, 0)).toBe(8);
    expect(gridVisibleCount(16, 0)).toBe(8);
    expect(gridVisibleCount(16, 1)).toBe(16);
    expect(gridVisibleCount(3, 0)).toBe(3);
    expect(gridShowMoreLabel(16, 8)).toBe("Show 8 more");
    expect(gridShowMoreLabel(9, 8)).toBe("Show 1 more");
    expect(gridShowMoreLabel(8, 8)).toBeNull();
    expect(gridFitLine(8)).toBe("8 therapists fit what you told us");
    expect(gridFitLine(1)).toBe("1 therapist fits what you told us");
    expect(gridYearsLabel("2017-01-01", now)).toBe("9 yrs in practice");
    expect(gridYearsLabel("2025-10-22", now)).toBe("1 yr in practice");
    expect(gridYearsLabel(null, now)).toBeNull();
    expect(takesInsuranceLine(["Aetna", "Cigna"], ["Aetna"])).toBe("Takes Aetna");
    expect(takesInsuranceLine(["Cigna"], [])).toBe("Takes Cigna");
    expect(
      takesInsuranceLine(["Out-of-Network Superbill", "Cash Pay Only"], []),
    ).toBeNull();
  });

  it("shows at most 8 cards and a show-more link", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    const html = results(10);
    expect(html).toContain("10 therapists fit what you told us");
    expect(html).toContain("Click anyone to see their full profile");
    expect(html).toContain('aria-current="page"');
    expect(html).toContain("Grid");
    expect(html).toContain("One at a time");
    for (let i = 1; i <= 8; i += 1) {
      expect(html).toContain(`Therapist ${String(i).padStart(2, "0")}`);
    }
    expect(html).not.toContain("Therapist 09");
    expect(html).not.toContain("Therapist 10");
    expect(html).toContain("Show 2 more");
    expect(html).toContain("more=1");
    expect(html).toContain("Takes Aetna");
    expect(html).toContain(
      `${yearsPracticing("2017-01-01")} yrs in practice`,
    );
    expect(html).toContain("PsyD · Licensed psychologist");
    expect(html).toContain("In person · Online");
    expect(html).toContain("I work best with...");
    expect(html).toContain('aria-label="Play intro video for Therapist 01"');
    expect(html).not.toContain('aria-label="Play intro video for Therapist 02"');
    expect(html).toContain("/find?tags=Aetna&amp;state=TX&amp;t=");
    expect(html).not.toContain("$");
    expect(html).not.toContain("150");
    expect(html).not.toContain("Sliding");
    expect(html).not.toContain("Get to know");
  });

  it("reveals the next 8 and then hides the button", () => {
    const first = results(16, { more: 0 });
    expect(first).toContain("Show 8 more");
    expect(first).not.toContain("Therapist 09");
    const next = results(16, { more: 1 });
    expect(next).toContain("Therapist 09");
    expect(next).toContain("Therapist 16");
    expect(next).not.toContain("Show 8 more");
    expect(next).not.toContain("Show 1 more");
  });

  it("shows the same card one at a time, without the chip cloud", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    const html = results(2, { layout: "one" });
    const card = html.slice(html.indexOf('data-find-card="one"'));
    const name = card.indexOf(">Therapist 01<");
    const credential = card.indexOf("PsyD · Licensed psychologist");
    const prompt = card.indexOf("I work best with...");
    const answer = card.indexOf("College students finding their way.");
    const takes = card.indexOf("Takes Aetna");
    const years = card.indexOf("yrs in practice");

    expect(html).toContain("Therapist 1 of 2 who fit what you told us");
    expect(html).toContain('data-find-layout="one"');
    expect(html).toContain("max-w-lg");
    expect(html).toContain("Therapist 02");
    expect(html).toContain('aria-label="Previous therapist"');
    expect(html).toContain('aria-label="Next therapist"');
    expect(html).toContain('aria-label="Play intro video for Therapist 01"');
    expect(html).toContain("In person · Online");
    expect(name).toBeGreaterThan(-1);
    expect(name).toBeLessThan(credential);
    expect(credential).toBeLessThan(prompt);
    expect(prompt).toBeLessThan(answer);
    expect(answer).toBeLessThan(takes);
    expect(takes).toBeLessThan(years);
    expect(html).toContain("layout=one");
    expect(html).toContain("&amp;t=");
    expect(html).not.toContain('href="/t/');
    expect(html).not.toContain('data-find-card="desk"');
    expect(html).not.toContain('data-find-layout="grid"');
    expect(html).not.toContain("Can help with");
    expect(html).not.toContain("Get to know");
    expect(html).not.toContain("Watch intro");
    expect(html).not.toContain("I WORK BEST WITH");
    expect(html).not.toContain("Licensed in");
    expect(html).not.toContain("Worry, stress or panic");
    expect(html).not.toContain("Out-of-network");
    expect(html).not.toContain("Show 8 more");
    expect(html).not.toContain("Click anyone to see their full profile");
    expect(html).not.toContain("$");
  });
});

describe("desktop find profile", () => {
  const id = "00000000-0000-4000-8000-000000000001";

  function profile(overrides: Partial<FindDetailProfile> = {}): FindDetailProfile {
    return {
      name: "Travis White",
      credential: "PsyD",
      photoUrl: "https://example.com/photo.jpg",
      videoUrl: "https://example.com/intro.mp4",
      virtual: true,
      inPerson: true,
      insurance: ["Aetna", "BCBS", "Medicare", "Out-of-Network Superbill"],
      superbill: true,
      licenses: [{ state: "TX" }],
      cards: [
        {
          prompt: "I work best with...",
          answer: "college students finding their way.",
        },
        {
          prompt: "A session with me feels like...",
          answer: "two people talking.",
        },
      ],
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
          href: "tel:+15125542231",
          value: "(512) 554-2231",
        },
      ],
      ...overrides,
    };
  }

  it("orders the work-best card first and prefers email for the consult", () => {
    expect(
      splitDetailCards([
        { prompt: "A session with me feels like...", answer: "Easy." },
        { prompt: "who I work best with...", answer: "Students." },
      ]),
    ).toEqual({
      lead: { prompt: "who I work best with...", answer: "Students." },
      rest: [{ prompt: "A session with me feels like...", answer: "Easy." }],
    });
    expect(detailConsult(profile().contact)).toEqual({
      href: "mailto:travis@example.com",
      cta: "consult",
    });
    expect(detailConsult([])).toBeNull();
    expect(
      detailConsult([
        {
          kind: "phone",
          label: "Call",
          href: "tel:+15125542231",
          value: "512",
        },
      ]),
    ).toEqual({ href: "tel:+15125542231", cta: "book" });
  });

  it("opens a card into the desktop profile layout", () => {
    const rows = [row(1, { name: "Travis White" }), row(2)];
    const detail = buildFindDetail({
      row: rows[0],
      profile: profile(),
      filterState: "TX",
      now: new Date("2026-10-22T12:00:00Z"),
    });
    const html = renderToStaticMarkup(
      createElement(FindDesktopResults, {
        rows,
        filters,
        view: { layout: "grid", more: 0, therapistId: id },
        detail,
      }),
    );
    expect(html).toContain("Therapist 1 of 2 who fit what you told us");
    expect(html).toContain("Travis White");
    expect(html).toContain("PsyD · Licensed psychologist");
    expect(html).toContain("Watch intro");
    expect(html).not.toContain("0:30");
    expect(html).not.toContain("Second photo");
    expect(html).toContain('aria-label="Previous therapist"');
    expect(html).not.toContain('href="/find?tags=Aetna&amp;state=TX&amp;t=00000000-0000-4000-8000-000000000000"');
    expect(html).toContain('aria-label="Next therapist"');
    expect(html).toContain("I work best with...");
    expect(html).toContain("college students finding their way.");
    expect(html).toContain("A session with me feels like...");
    expect(html).toContain("In person");
    expect(html).toContain("Online");
    expect(html).toContain("9 yrs in practice");
    expect(html).toContain("Licensed in Texas");
    expect(html).toContain("Aetna, BCBS, Medicare");
    expect(html).toContain("Out-of-network superbill");
    expect(html).toContain("Paying yourself? Get reimbursed later");
    expect(html).toContain("Book a free 15-min consult");
    expect(html).toContain("Book a session");
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).not.toContain("mailto:");
    expect(html).not.toContain("tel:");
    expect(html).toContain("All matches");
    expect(html).not.toContain("$");
    expect(html).not.toContain("Cash pay");
    expect(html).not.toContain("Areas of interest");
    expect(html).not.toContain(">Fees<");
    expect(html).not.toContain(">Identity<");
    expect(html).not.toContain("You might click with me if");
  });

  it("shows every public intake answer that was saved and skips the empty ones", () => {
    const rows = [row(1, { name: "Travis White", insurance_labels: ["Cash Pay Only"] })];
    const detail = buildFindDetail({
      row: rows[0],
      profile: profile({
        insurance: ["Cash Pay Only"],
        superbill: false,
        licenses: [{ state: "TX", number: "38047" }],
        credentials: ["EMDR trained"],
        education: ["M.A. Counseling Psychology"],
        specialties: ["Life Transitions"],
        modalities: ["CBT"],
        identity: ["BIPOC", "LGBTQ+"],
        rates: [
          { service_type: "Individual", duration_minutes: 50, price_cents: 15000 },
        ],
        slidingScale: true,
        office: {
          address: "1102 West 6th Street",
          address2: null,
          state: "TX",
          zip: "78703",
        },
        about: "I sit with people while they sort out a next step.",
        voiceUrl: "https://example.com/voice.mp3",
        voicePrompt: "Why I do this work",
        reviews: [
          {
            id: "review-1",
            stars: 5,
            understood: 5,
            communication: 5,
            fit: 5,
            body: "Steady and direct.",
            session_format: null,
            duration_label: null,
            reviewer_name: "Alex",
            anonymous: false,
            created_at: "2026-01-02T00:00:00Z",
            mine: false,
            status: "approved",
          },
        ],
      }),
      filterState: "TX",
      now: new Date("2026-10-22T12:00:00Z"),
    });
    const html = renderToStaticMarkup(
      createElement(FindDesktopResults, {
        rows,
        filters: { tags: [], virtual: false, inPerson: false, state: "TX" },
        view: { layout: "grid", more: 0, therapistId: id },
        detail,
      }),
    );
    expect(html).toContain("PsyD · Licensed psychologist · EMDR trained");
    expect(html).toContain("Licensed in Texas (#38047)");
    expect(html).toContain("Cash pay");
    expect(html).not.toContain("Out-of-network superbill");
    expect(html).toContain("1102 West 6th Street");
    expect(html).toContain("TX 78703");
    expect(html).toContain("Areas of interest");
    expect(html).toContain("Life transitions");
    expect(html).toContain("Approach in therapy");
    expect(html).toContain("Cognitive behavioral therapy (CBT)");
    expect(html).toContain(">Identity<");
    expect(html).toContain("BIPOC");
    expect(html).toContain("LGBTQ+");
    expect(html).toContain("Education");
    expect(html).toContain("M.A. Counseling Psychology");
    expect(html).toContain(">Fees<");
    expect(html).toContain("Individual session (50 min)");
    expect(html).toContain("$150");
    expect(html).toContain("Sliding scale");
    expect(html).toContain("Available");
    expect(html).toContain("Why I do this work");
    expect(html).toContain("Play voice prompt for Travis White");
    expect(html).toContain("In Travis");
    expect(html).toContain("I sit with people while they sort out a next step.");
    expect(html).toContain(">Reviews<");
    expect(html).toContain("Steady and direct.");
    expect(html).toContain("Alex");
    expect(html).not.toContain("None listed");
    expect(html).not.toContain("No reviews yet");
    expect(html).not.toContain("travis@example.com</");
  });

  it("omits years, the consult, the intro, and a license the row does not have", () => {
    const detail = buildFindDetail({
      row: row(1, {
        start_date_of_practice: null,
        video_key: null,
        card_prompt: null,
        card_answer: null,
        insurance_labels: [],
        in_person_practice: false,
        virtual_practice: false,
      }),
      profile: profile({
        videoUrl: null,
        photoUrl: null,
        cards: [],
        contact: [],
        licenses: [],
        insurance: [],
        superbill: false,
        virtual: false,
        inPerson: false,
      }),
      filterState: null,
    });
    const html = renderToStaticMarkup(
      createElement(FindDesktopResults, {
        rows: [row(1)],
        filters: { tags: [], virtual: false, inPerson: false, state: null },
        view: { layout: "grid", more: 0, therapistId: detail.id },
        detail,
      }),
    );
    expect(html).not.toContain("yrs in practice");
    expect(html).not.toContain("Watch intro");
    expect(html).not.toContain("Book a free 15-min consult");
    expect(html).not.toContain("Licensed in");
    expect(html).not.toContain("Out-of-network superbill");
    expect(html).not.toContain("I work best with...");
    expect(html).not.toContain("Second photo");
    expect(html).not.toContain("Areas of interest");
    expect(html).not.toContain(">Fees<");
    expect(html).not.toContain(">Identity<");
    expect(html).not.toContain(">Education<");
    expect(html).not.toContain(">Reviews<");
    expect(html).not.toContain("own words");
    expect(html).not.toContain("Book a session");
    expect(html).not.toContain("Cash pay");
    expect(html).not.toContain("None listed");
  });
});
