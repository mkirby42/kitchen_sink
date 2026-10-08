import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { JoinStep3 } from "@/components/join/JoinStep3";
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
    specialties: ["Anxiety", "Career"],
    modalities: ["CBT"],
    insurance: ["Aetna"],
    identity: [],
    location: null,
    rates: [],
    slidingScale: false,
    slidingScaleMinCents: null,
    slidingScaleMaxCents: null,
    cards: [],
    about: "",
    email: "",
    phone: "",
    outreach: [],
    feedback: "",
    ...overrides,
  };
}

describe("join specialties picker", () => {
  it("offers the Find list and keeps a stored off-list specialty selected", () => {
    const html = renderToStaticMarkup(
      createElement(JoinStep3, { draft: draft(), setDraft: () => {} }),
    );
    const specialties = html.indexOf("Areas of Interest");
    const modalities = html.indexOf("Approach in Therapy");
    const insurance = html.indexOf("Insurance");
    expect(specialties).toBeGreaterThan(-1);
    expect(modalities).toBeGreaterThan(specialties);
    expect(html).not.toContain("Modalities");
    const specialtyBlock = html.slice(specialties, modalities);
    expect(specialtyBlock).toContain("Anxiety");
    expect(specialtyBlock).toContain("Career");
    expect(specialtyBlock).not.toContain("Add your own");
    expect(specialtyBlock).not.toContain('placeholder="Add your own"');
    const approachBlock = html.slice(modalities, insurance);
    expect(approachBlock).toContain("Add your own");
    expect(approachBlock).toMatch(
      /aria-pressed="true"[^>]*>\s*Cognitive Behavioral Therapy \(CBT\)</,
    );
    expect(approachBlock).toContain(">Psychodynamic<");
    expect(approachBlock).toContain(
      ">Eye Movement Desensitization and Reprocessing (EMDR)<",
    );
    expect(approachBlock).not.toContain(">CBT<");
    expect(html.slice(insurance)).toContain("Add your own");
  });

  it("shows a stored phrase as written and keeps the short code selected", () => {
    const html = renderToStaticMarkup(
      createElement(JoinStep3, {
        draft: draft({
          modalities: ["CBT", "Solution Focused Brief (SFBT)"],
        }),
        setDraft: () => {},
      }),
    );
    expect(html).toContain("Solution Focused Brief (SFBT)");
    expect(html).toMatch(
      /aria-pressed="true"[^>]*>\s*Cognitive Behavioral Therapy \(CBT\)</,
    );
  });
});
