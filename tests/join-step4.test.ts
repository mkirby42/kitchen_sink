import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { JoinStep4 } from "@/components/join/JoinStep4";
import type { JoinDraft } from "@/lib/join/types";

function draft(overrides: Partial<JoinDraft> = {}): JoinDraft {
  return {
    name: "Maya Chen",
    credential: "LMFT",
    yearsPracticing: 9,
    education: [""],
    credentials: [""],
    licenses: [{ number: "MFC 112938", state: "CA" }],
    photoKey: "photo.jpg",
    videoKey: null,
    openToNewClients: true,
    virtual: true,
    inPerson: false,
    specialties: ["Anxiety"],
    modalities: ["CBT"],
    insurance: ["Aetna"],
    identity: [],
    location: null,
    rates: [
      { service_type: "Individual", duration_minutes: 50, price_cents: 16500 },
    ],
    cards: [
      { prompt: "my approach to therapy is...", answer: "Warm.", tag: "approach" },
    ],
    about: "",
    email: "maya@example.com",
    phone: "",
    outreach: ["email"],
    feedback: "",
    ...overrides,
  };
}

function render(overrides: Partial<JoinDraft> = {}) {
  return renderToStaticMarkup(
    createElement(JoinStep4, { draft: draft(overrides), setDraft: () => {} }),
  );
}

describe("JoinStep4 contact and rates", () => {
  it("renders the full service type, not a clipped label", () => {
    const html = render();
    expect(html).toContain("Individual");
    expect(html).toContain('aria-label="Rate 1 service type"');
  });

  it("uses free text for the session price and keeps duration selectable", () => {
    const html = render();
    expect(html).toContain('aria-label="Rate 1 price in dollars"');
    expect(html).toContain('type="text"');
    expect(html).toContain('inputmode="decimal"');
    expect(html).toContain('value="165"');
    expect(html).not.toContain('type="number"');
    expect(html).toContain('aria-label="Rate 1 duration"');
    expect(html).toContain(">50 min<");
    expect(html).toContain(">30 min<");
  });

  it("shows a free-text field for each selected outreach method", () => {
    const html = render({
      outreach: ["email", "phone", "text"],
      phone: "(415) 555-0199",
    });
    expect(html).toContain("Email");
    expect(html).toContain("Phone number");
    expect(html).toContain("Number for texts");
    expect(html).toContain("maya@example.com");
    expect(html).toContain("(415) 555-0199");
  });

  it("hides phone and text fields until those chips are selected", () => {
    const html = render({ outreach: ["email"] });
    expect(html).toContain("Email");
    expect(html).not.toContain("Phone number");
    expect(html).not.toContain("Number for texts");
  });

  it("hides product feedback when editing an existing profile", () => {
    const html = renderToStaticMarkup(
      createElement(JoinStep4, {
        draft: draft(),
        setDraft: () => {},
        hideFeedback: true,
      }),
    );
    expect(html).not.toContain("Feedback for us");
  });
});
