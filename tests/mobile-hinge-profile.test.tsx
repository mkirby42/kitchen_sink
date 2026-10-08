import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh() {}, push() {}, replace() {} }),
}));

import { TherapistProfile } from "@/components/profile/TherapistProfile";
import type { ReviewViewer } from "@/lib/reviews/viewer";
import { routes } from "@/lib/routes";
import type { TherapistProfileData } from "@/lib/therapists/load";

const visitor: ReviewViewer = {
  userId: null,
  role: null,
  isOwner: false,
};

const texas = "Licensed by State of Texas / 38047";

const base: TherapistProfileData = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Travis White",
  givenName: "Travis",
  email: "travis@example.com",
  phone: "(512) 555-0199",
  about: "I help people find their way.",
  photoUrl: "https://example.com/photo.jpg",
  videoUrl: "https://example.com/intro.mp4",
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
  specialties: ["Anxiety", "Life Transitions"],
  modalities: ["ACT", "CBT"],
  insurance: ["Aetna", "Out-of-Network Superbill"],
  inNetwork: ["Aetna"],
  identity: [],
  cards: [
    {
      prompt: "a session with me feels like...",
      answer: "It is just two people talking.",
      tag: "session_vibe",
    },
    {
      prompt: "outside of session, I...",
      answer: "I like to run, train, and cook.",
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
};

function render(data: TherapistProfileData = base) {
  return renderToStaticMarkup(
    createElement(TherapistProfile, {
      data,
      backHref: routes.find,
      viewer: visitor,
    }),
  );
}

function region(html: string, name: "mobile" | "desk") {
  const start = html.indexOf(`data-profile-layout="${name}"`);
  const rest = html.slice(start);
  if (name === "mobile") {
    const end = rest.indexOf('data-profile-layout="desk"');
    return end === -1 ? rest : rest.slice(0, end);
  }
  return rest;
}

describe("mobile hinge profile", () => {
  it("puts the name and license badge above a split photo and video", () => {
    const html = render();
    const mobile = region(html, "mobile");
    const desk = region(html, "desk");

    expect(mobile.indexOf(">Travis White</h1>")).toBeGreaterThan(-1);
    expect(mobile.indexOf("data-license-badge")).toBeGreaterThan(
      mobile.indexOf(">Travis White</h1>"),
    );
    expect(mobile).toContain(texas);
    expect(mobile).toContain("text-5xl");
    expect(desk).not.toContain("data-license-badge");
    expect(desk).not.toContain("text-5xl");

    const lead = mobile.indexOf("data-lead-media");
    const firstPrompt = mobile.indexOf("a session with me feels like...");
    const extra = mobile.indexOf("data-extra-media");
    const secondPrompt = mobile.indexOf("outside of session, I...");
    expect(lead).toBeGreaterThan(-1);
    expect(lead).toBeLessThan(firstPrompt);
    expect(firstPrompt).toBeLessThan(extra);
    expect(extra).toBeLessThan(secondPrompt);

    const leadChunk = mobile.slice(lead, firstPrompt);
    expect(leadChunk).toContain('data-hero-overlay="true"');
    expect(leadChunk).toContain(texas);
    expect(leadChunk).not.toContain("Play intro video");
    expect(leadChunk).not.toContain("PsyD");
    expect(leadChunk).toContain("8 yrs practicing");

    const extraChunk = mobile.slice(extra, secondPrompt);
    expect(extraChunk).toContain('data-hero-overlay="false"');
    expect(extraChunk).toContain("Play intro video for Travis White");
    expect(extraChunk).toContain("bg-transparent");
    expect(extraChunk).toContain("border-paper/80");
    expect(extraChunk).not.toContain(texas);

    expect(mobile).toContain('data-prompt-variant="hinge"');
    expect(mobile).toContain("text-[1.7rem]");
    expect(mobile).not.toContain("text-clay italic");
    expect(mobile).not.toContain("Get to know");
    expect(desk).toContain('data-prompt-variant="classic"');
    expect(desk).toContain("text-clay italic");
    expect(desk).toContain("Get to know");

    expect(html).not.toContain("♡");
    expect(html).not.toContain("♥");
    expect(html).not.toContain(">Verified<");
    expect(html).not.toContain("Hinge");
  });

  it("leads with the only photo and then the prompts", () => {
    const mobile = region(render({ ...base, videoUrl: null }), "mobile");
    const lead = mobile.indexOf("data-lead-media");
    const firstPrompt = mobile.indexOf("a session with me feels like...");
    expect(mobile).not.toContain("data-extra-media");
    expect(mobile).not.toContain("Play intro video");
    expect(lead).toBeLessThan(firstPrompt);
    expect(mobile.indexOf("outside of session, I...")).toBeGreaterThan(firstPrompt);
    expect(mobile.slice(lead, firstPrompt)).toContain('data-hero-overlay="true"');
  });

  it("leads with the only video", () => {
    const mobile = region(render({ ...base, photoUrl: null }), "mobile");
    const lead = mobile.indexOf("data-lead-media");
    const firstPrompt = mobile.indexOf("a session with me feels like...");
    expect(mobile).not.toContain("data-extra-media");
    expect(lead).toBeLessThan(firstPrompt);
    expect(mobile.slice(lead, firstPrompt)).toContain("Play intro video");
    expect(mobile.slice(lead, firstPrompt)).toContain('data-hero-overlay="true"');
  });

  it("keeps logistics, modalities, and the pinned consult actions", () => {
    const html = render();
    const modalities = html.indexOf("Modalities");
    const specialties = html.indexOf("Specialties");
    const logistics = html.indexOf("Logistics");
    expect(modalities).toBeGreaterThan(-1);
    expect(specialties).toBeGreaterThan(modalities);
    expect(logistics).toBeGreaterThan(specialties);
    expect(html).toContain("1102 West 6th Street, Austin");
    expect(html.indexOf("1102 West 6th Street, Austin", html.indexOf("1102 West 6th Street, Austin") + 1)).toBe(-1);
    expect(html).toContain(">In person</li>");
    expect(html).toContain(">Virtual</li>");
    expect(html).toContain("Individual session (55 min)");
    expect(html).toContain("$150");
    expect(html).toContain("Aetna");
    expect(html).toContain("Superbill provided");
    expect(html).toContain('data-cta-placement="dock"');
    expect(html).toContain("Free Consult");
    expect(html).toContain("Book a Session");
    const switchAt = html.indexOf("data-profile-switch");
    expect(html.slice(switchAt, switchAt + 120)).toContain("max-md:hidden");
    expect(html).toContain("max-md:block md:hidden");
    expect(html).toContain("No reviews yet.");
    expect(html).toContain("Doctor of Clinical Psychology");
    expect(html).toContain("ACT");
    const mobile = region(html, "mobile");
    expect(mobile.indexOf("a session with me feels like...")).toBeLessThan(
      html.indexOf("Modalities"),
    );
  });
});
