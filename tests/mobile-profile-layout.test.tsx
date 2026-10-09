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

function slot(html: string, show: "phone" | "desk") {
  const start = html.indexOf(`data-profile-show="${show}"`);
  if (show === "phone") {
    return html.slice(start, html.indexOf("Get to know", start));
  }
  return html.slice(start);
}

describe("phone profile layout", () => {
  it("uses one lead card and stacks details under it, then conversation and the switch", () => {
    const html = render();
    const phoneTree = html.slice(
      html.indexOf('data-profile-layout="phone"'),
      html.indexOf('data-profile-layout="desk"'),
    );
    const deskTree = html.slice(html.indexOf('data-profile-layout="desk"'));
    expect(phoneTree.match(/data-hero-media/g)).toHaveLength(1);
    expect(deskTree.match(/data-hero-media/g)).toHaveLength(1);
    expect(html).not.toContain("data-extra-media");
    expect(html).not.toContain("data-license-badge");
    expect(html).not.toContain('data-prompt-variant="hinge"');

    const media = html.indexOf('data-profile-layout="media"');
    const education = html.indexOf("Education");
    const modalities = html.indexOf("Approach in Therapy");
    const specialties = html.indexOf("Areas of Interest");
    const phone = html.indexOf('data-profile-show="phone"');
    const know = html.indexOf("Get to know");
    const switchAt = html.indexOf("data-profile-switch");
    const desk = html.indexOf('data-profile-layout="desk"');

    expect(media).toBeGreaterThan(-1);
    expect(media).toBeLessThan(education);
    expect(education).toBeLessThan(modalities);
    expect(modalities).toBeLessThan(specialties);
    expect(specialties).toBeLessThan(phone);
    expect(phone).toBeLessThan(know);
    expect(know).toBeLessThan(switchAt);
    expect(switchAt).toBeLessThan(desk);

    const lead = html.slice(media, education);
    expect(lead).toContain("https://example.com/photo.jpg");
    expect(lead).toContain("Play intro video for Travis White");
    expect(lead).toContain("bg-transparent");
    expect(lead).toContain("border-paper/80");
    expect(lead).toContain(">Travis White</h1>");
    expect(lead).toContain(texas);
    expect(lead).toContain("8 yrs practicing");
    expect(lead).not.toContain("PsyD");

    expect(html.slice(know, switchAt)).toContain('data-prompt-variant="classic"');
    expect(html.slice(know, switchAt)).toContain("text-sm font-medium leading-snug text-ink");
    expect(html.slice(know, switchAt)).toContain("text-[1.75rem]");
    expect(html.slice(know, switchAt)).toContain("a session with me feels like...");
    expect(html.slice(know, switchAt)).toContain("outside of session, I...");

    const phoneSlot = slot(html, "phone");
    expect(phoneSlot).toContain("md:hidden");
    expect(phoneSlot).toContain("How Travis");
    expect(phoneSlot).toContain(">works</em>");
    expect(phoneSlot).not.toContain("Logistics");
    expect(phoneSlot).toContain("1102 West 6th Street, Austin");
    expect(phoneSlot).toContain(">In person</li>");
    expect(phoneSlot).toContain(">Virtual</li>");
    expect(phoneSlot).not.toContain("I help people find their way.");
    expect(phoneSlot).not.toContain(">Office<");

    expect(deskTree).toContain("hidden md:grid");
    expect(deskTree).toContain("How Travis");
    expect(deskTree).toContain("1102 West 6th Street, Austin");
    expect(deskTree).toContain("I help people find their way.");
    expect(deskTree).toContain(">Office<");
    const visible = deskTree.replace(/&#x27;/g, "'");
    expect(visible).toContain("Watch Travis's intro");
    expect(visible).toContain("In Travis's own");
    expect(deskTree).toContain("PsyD · Licensed Psychologist");
    expect(deskTree).not.toContain("How he");
    expect(deskTree).not.toContain(">Approaches<");
    expect(deskTree).not.toContain("Logistics");
    expect(deskTree).toContain("Areas of Interest");
    expect(deskTree).toContain("Approach in Therapy");
    expect(deskTree.indexOf("Areas of Interest")).toBeLessThan(
      deskTree.indexOf("Approach in Therapy"),
    );
    expect(deskTree).toContain("bg-ink px-3.5");
    const stack = deskTree.indexOf('data-cta-placement="stack"');
    expect(deskTree.indexOf("Book a Session", stack)).toBeLessThan(
      deskTree.indexOf("Free Consult", stack),
    );

    expect(html.slice(switchAt, switchAt + 80)).not.toContain("max-md:hidden");
    expect(html).not.toContain("max-md:block");
    expect(html).toContain('data-cta-placement="dock"');
    expect(html).toContain("Free Consult");
    expect(html).toContain("Book a Session");
    expect(html).toContain("lg:grid-cols-[minmax(0,26.5rem)_minmax(0,1fr)]");
    expect(html).not.toContain("♡");
    expect(html).not.toContain("Hinge");
  });

  it("wraps a long approach pill inside the phone column", () => {
    const html = render();
    const phoneTree = html.slice(
      html.indexOf('data-profile-layout="phone"'),
      html.indexOf('data-profile-layout="desk"'),
    );
    const label = "Acceptance and Commitment Therapy (ACT)";
    const at = phoneTree.indexOf(label);
    expect(at).toBeGreaterThan(-1);
    const open = phoneTree.lastIndexOf("<li", at);
    const li = phoneTree.slice(open, phoneTree.indexOf(">", open));
    expect(li).toContain("max-w-full");
    expect(li).toContain("min-w-0");
    expect(li).toContain("whitespace-normal");
    expect(li).not.toContain("whitespace-nowrap");
  });

  it("keeps a photo-only and a video-only profile on that same lead card", () => {
    const photo = render({ ...base, videoUrl: null });
    expect(photo.match(/data-hero-media/g)).toHaveLength(2);
    expect(photo).not.toContain("Play intro video");
    expect(photo.indexOf("https://example.com/photo.jpg")).toBeLessThan(
      photo.indexOf("Education"),
    );

    const video = render({ ...base, photoUrl: null });
    const media = video.indexOf('data-profile-layout="media"');
    const education = video.indexOf("Education");
    expect(video.slice(media, education)).toContain("Play intro video");
    expect(video.match(/data-hero-media/g)).toHaveLength(2);
  });
});
