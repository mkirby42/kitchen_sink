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
    slidingScale: false,
    slidingScaleMinCents: null,
    slidingScaleMaxCents: null,
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

function isDisabled(buttonHtml: string) {
  return /(?:^|\s)disabled(?:=|\s|>)/.test(buttonHtml);
}

function promptButton(html: string, prompt: string) {
  const index = html.indexOf(`>${prompt}</span>`);
  const start = html.lastIndexOf("<button", index);
  return html.slice(start, index);
}

function ownPromptButton(html: string) {
  const index = html.indexOf("Write your own prompt");
  const start = html.lastIndexOf("<button", index);
  return html.slice(start, index);
}

function removeButton(html: string, prompt: string) {
  const marker = `aria-label="Remove ${prompt}"`;
  const index = html.indexOf(marker);
  const start = html.lastIndexOf("<button", index);
  return html.slice(start, index + marker.length);
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
    expect(html).toContain('inputMode="decimal"');
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

  it("counts conversation cards out of 6 and stops adds at the max", () => {
    const one = render();
    expect(one).toContain("1 of 6 added");
    expect(
      isDisabled(promptButton(one, "a session with me feels like...")),
    ).toBe(false);
    expect(isDisabled(ownPromptButton(one))).toBe(false);

    const six = render({
      cards: Array.from({ length: 6 }, (_, index) => ({
        prompt: `prompt ${index + 1}`,
        answer: `answer ${index + 1}`,
        tag: "custom",
      })),
    });
    expect(six).toContain("6 of 6 added");
    expect(isDisabled(promptButton(six, "my approach to therapy is..."))).toBe(
      true,
    );
    expect(isDisabled(ownPromptButton(six))).toBe(true);
    expect(isDisabled(removeButton(six, "prompt 1"))).toBe(false);
  });

  it("offers a sliding scale toggle and optional min and max", () => {
    const off = render();
    expect(off).toContain("Sliding scale");
    expect(off).toContain('role="switch"');
    expect(off).toContain('aria-checked="false"');
    expect(off).not.toContain("Sliding scale minimum in dollars");

    const on = render({
      slidingScale: true,
      slidingScaleMinCents: 8000,
      slidingScaleMaxCents: 12000,
    });
    expect(on).toContain('aria-checked="true"');
    expect(on).toContain('aria-label="Sliding scale minimum in dollars"');
    expect(on).toContain('aria-label="Sliding scale maximum in dollars"');
    expect(on).toContain('value="80"');
    expect(on).toContain('value="120"');
    expect(on).toContain("without listing a range");
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
