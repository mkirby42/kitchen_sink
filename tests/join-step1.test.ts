import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { JoinStep1 } from "@/components/join/JoinStep1";
import type { JoinDraft } from "@/lib/join/types";

function draft(overrides: Partial<JoinDraft> = {}): JoinDraft {
  return {
    name: "Maya Chen",
    credential: "LMFT",
    yearsPracticing: 9,
    education: ["B.A. Psychology"],
    credentials: ["EMDR trained"],
    licenses: [{ number: "MFC 112938", state: "CA" }],
    photoKey: "photo.jpg",
    videoKey: null,
    openToNewClients: true,
    virtual: true,
    inPerson: false,
    specialties: [],
    modalities: [],
    insurance: [],
    identity: [],
    location: null,
    rates: [],
    slidingScale: false,
    slidingScaleMinCents: null,
    slidingScaleMaxCents: null,
    cards: [],
    about: "",
    email: "maya@example.com",
    phone: "",
    outreach: ["email"],
    feedback: "",
    ...overrides,
  };
}

describe("JoinStep1 qualifications", () => {
  it("renders education and extra credential rows, not associate or supervisor fields", () => {
    const html = renderToStaticMarkup(
      createElement(JoinStep1, { draft: draft(), setDraft: () => {} }),
    );

    expect(html).toContain("Education (optional)");
    expect(html).toContain("Credentials &amp; certificates (optional)");
    expect(html).toContain("B.A. Psychology");

    const tags = html.match(/<[^>]+>/g) ?? [];
    const tag = (marker: string) =>
      tags.find((item) => item.includes(marker)) ?? "";

    const name = tag('autoComplete="name"');
    expect(name).toContain('required=""');
    expect(name).toContain('aria-required="true"');

    const licenseNumber = tag('aria-label="License 1 number"');
    expect(licenseNumber).toContain('required=""');
    const licenseState = tag('aria-label="License 1 state"');
    expect(licenseState).toContain('required=""');

    const education = tag('aria-label="Education (optional) 1"');
    expect(education).not.toContain("required");
    const certificates = tag(
      'aria-label="Credentials &amp; certificates (optional) 1"',
    );
    expect(certificates).not.toContain("required");
    expect(html).toContain("EMDR trained");
    expect(html).toContain("LMFT");
    expect(html).not.toContain("Associate MFT");
    expect(html).not.toContain("Supervising clinician");
    expect(html).not.toContain("Supervisor");
  });
});
