// Product-decision guard. Do not weaken this file to make CI pass.
// See docs/product-decisions.md.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FindDesktopDetail } from "@/components/search/FindDesktopDetail";
import { buildFindDetail } from "@/lib/search/find-detail";
import type { SearchRow } from "@/lib/search/rpc";

const row: SearchRow = {
  profile_id: "00000000-0000-4000-8000-000000000001",
  name: "Travis White",
  photo_key: null,
  credential: "PsyD",
  start_date_of_practice: "2018-01-01",
  min_price_cents: 15000,
  min_duration_minutes: 55,
  virtual_practice: true,
  in_person_practice: true,
  specialty_labels: ["Anxiety"],
  insurance_labels: ["Aetna"],
  match_count: 1,
  matched_labels: ["Aetna"],
  sliding_scale: true,
  video_key: null,
  card_prompt: "I work best with...",
  card_answer: "People who want a straight answer.",
  card_tag: "about",
};

describe("desktop find detail guard", () => {
  it("stays on Find and opens booking in the contact sheet", () => {
    const detail = buildFindDetail({
      row,
      filterState: "TX",
      now: new Date("2026-10-22T12:00:00Z"),
      profile: {
        name: "Travis White",
        credential: "PsyD",
        photoUrl: "https://example.com/photo.jpg",
        videoUrl: "https://example.com/intro.mp4",
        virtual: true,
        inPerson: true,
        insurance: ["Aetna"],
        superbill: true,
        licenses: [{ state: "TX", number: "38047" }],
        cards: [
          {
            prompt: "I work best with...",
            answer: "People who want a straight answer.",
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
            href: "tel:+15125550199",
            value: "(512) 555-0199",
          },
        ],
        credentials: ["Licensed Psychologist"],
        education: ["State University"],
        specialties: ["Anxiety"],
        modalities: ["CBT"],
        identity: ["BIPOC"],
        rates: [
          {
            service_type: "Individual",
            duration_minutes: 55,
            price_cents: 15000,
          },
        ],
        slidingScale: true,
        about: "I sit with people.",
        office: {
          address: "1102 West 6th Street",
          address2: null,
          state: "TX",
          zip: "78703",
        },
        openToNewClients: true,
        givenName: "Travis",
      },
    });
    const html = renderToStaticMarkup(
      createElement(FindDesktopDetail, {
        detail,
        index: 0,
        count: 3,
        previousHref: null,
        nextHref: "/find?t=next",
        backHref: "/find",
      }),
    );
    expect(html).toContain("Travis White");
    expect(html).toContain("Watch intro");
    expect(html).toContain("All matches");
    expect(html).toContain('href="/find"');
    expect(html).toContain("Next therapist");
    expect(html).toContain("Therapist 1 of 3 who fit what you told us");
    expect(html).toContain("People who want a straight answer.");
    expect(html).toContain("Areas of interest");
    expect(html).toContain("Approach in therapy");
    expect(html).toContain("Cognitive behavioral therapy (CBT)");
    expect(html).toContain("State University");
    expect(html).toContain("Identity");
    expect(html).toContain("BIPOC");
    expect(html).toContain("1102 West 6th Street");
    expect(html).toContain("I sit with people.");
    expect(html).toContain("$150");
    expect(html).toContain("Book a session");
    expect(html).toContain("Book a free 15-min consult");
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).not.toContain("mailto:");
    expect(html).not.toContain("tel:");
  });
});
