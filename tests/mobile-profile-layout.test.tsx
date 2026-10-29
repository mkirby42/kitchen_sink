import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh() {}, push() {}, replace() {} }),
}));

import { TherapistProfile } from "@/components/profile/TherapistProfile";
import { withoutNoJsMedia } from "./no-js-html";
import type { ReviewViewer } from "@/lib/reviews/viewer";
import { routes } from "@/lib/routes";
import { NOT_ACCEPTING_CLIENTS_LABEL } from "@/lib/therapists/listing";
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
  openToNewClients: true,
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
  it("uses one lead card, then how-they-work and conversation, then education before own words", () => {
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

    const media = phoneTree.indexOf('data-profile-layout="media"');
    const education = phoneTree.indexOf("Education");
    const modalities = phoneTree.indexOf("Approach in therapy");
    const specialties = phoneTree.indexOf("Areas of interest");
    const phone = phoneTree.indexOf('data-profile-show="phone"');
    const know = phoneTree.indexOf("Get to know");
    const own = phoneTree.indexOf("own words");
    const switchAt = phoneTree.indexOf("data-profile-switch");
    const desk = html.indexOf('data-profile-layout="desk"');

    expect(media).toBeGreaterThan(-1);
    expect(media).toBeLessThan(phone);
    expect(phone).toBeLessThan(education);
    expect(education).toBeLessThan(know);
    const shot = phoneTree.indexOf("data-profile-photo");
    expect(shot).toBeGreaterThan(phoneTree.indexOf("How Travis works"));
    expect(know).toBeGreaterThan(shot);
    expect(phoneTree.slice(shot, know)).toContain("https://example.com/photo.jpg");
    expect(phoneTree.slice(shot, know)).toContain("Photo of Travis White");
    expect(know).toBeLessThan(modalities);
    expect(modalities).toBeLessThan(specialties);
    expect(specialties).toBeLessThan(own);
    expect(own).toBeLessThan(switchAt);
    expect(html.indexOf("data-profile-switch")).toBeLessThan(desk);

    const lead = phoneTree.slice(media, phone);
    const scriptedLead = withoutNoJsMedia(lead);
    expect(lead).toContain('preload="none"');
    expect(lead).not.toContain("https://example.com/photo.jpg");
    expect(scriptedLead).not.toContain("https://example.com/photo.jpg");
    expect(scriptedLead).not.toContain("data-video-still");
    expect(scriptedLead).not.toContain("intro.mp4");
    expect(lead).toContain("Play intro video for Travis White");
    expect(lead).toContain("bg-transparent");
    expect(lead).toContain("border-paper/80");
    expect(lead).toContain(">Travis White</h1>");
    expect(lead).toContain(texas);
    expect(lead).toContain("8 yrs practicing");
    expect(lead).not.toContain("PsyD");

    const conversation = phoneTree.slice(know, modalities);
    expect(conversation).toContain('data-prompt-variant="classic"');
    expect(conversation).toContain("text-prompt");
    expect(conversation).toContain("text-[20px]");
    expect(conversation).toContain("md:text-[22px]");
    expect(conversation).toContain("a session with me feels like...");
    expect(conversation).toContain("outside of session, I...");
    expect(conversation).not.toContain("Approach in therapy");

    const phoneSlot = slot(html, "phone");
    expect(phoneSlot).toContain("md:hidden");
    expect(phoneSlot).toContain("How Travis works");
    expect(phoneTree.indexOf(texas)).toBeLessThan(phoneTree.indexOf("Education"));
    expect(phoneSlot.indexOf("Education")).toBeLessThan(phoneSlot.indexOf("Aetna"));
    expect(phoneSlot.indexOf("Credentials")).toBeLessThan(phoneSlot.indexOf("Aetna"));
    expect(phoneSlot).not.toContain(">Identity<");
    expect(phoneSlot).not.toContain(">works</em>");
    expect(phoneSlot).toContain(">In person<");
    expect(phoneSlot).toContain(">Online<");
    expect(phoneSlot).not.toContain(">Virtual<");
    expect(phoneSlot).not.toContain("Logistics");
    expect(phoneSlot).toContain("1102 West 6th Street, Austin");
    expect(phoneSlot).not.toContain("rounded-full border");
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
    expect(deskTree).toContain("PsyD · Licensed psychologist");
    expect(deskTree).not.toContain("How he");
    expect(deskTree).not.toContain(">Approaches<");
    expect(deskTree).not.toContain("Logistics");
    expect(deskTree).toContain("Areas of interest");
    expect(deskTree).toContain("Approach in therapy");
    expect(deskTree.indexOf("Licensed by State of Texas / 38047")).toBeLessThan(
      deskTree.indexOf("Education"),
    );
    expect(deskTree.indexOf("Education")).toBeLessThan(deskTree.indexOf("Aetna"));
    expect(deskTree.indexOf("Education")).toBeLessThan(
      deskTree.indexOf("Areas of interest"),
    );
    expect(deskTree.indexOf("Areas of interest")).toBeLessThan(
      deskTree.indexOf("Approach in therapy"),
    );
    expect(deskTree.indexOf("Approach in therapy")).toBeLessThan(
      deskTree.indexOf("data-profile-photo"),
    );
    expect(deskTree.indexOf("data-profile-photo")).toBeLessThan(
      deskTree.indexOf("Get to know"),
    );
    expect(deskTree.slice(0, deskTree.indexOf("How Travis works"))).not.toContain(
      "https://example.com/photo.jpg",
    );
    expect(deskTree).toContain("bg-pill-bg");
    expect(deskTree).toContain("Life transitions");
    expect(deskTree).not.toContain("text-clay\">");
    const stack = deskTree.indexOf('data-cta-placement="stack"');
    expect(deskTree.indexOf("Free consult", stack)).toBeLessThan(
      deskTree.indexOf("Book a session", stack),
    );
    const dock = phoneTree.indexOf('data-cta-placement="dock"');
    expect(phoneTree.indexOf("Free consult", dock)).toBeLessThan(
      phoneTree.indexOf("Book a session", dock),
    );

    expect(phoneTree.slice(switchAt, switchAt + 80)).not.toContain("max-md:hidden");
    expect(html).not.toContain("max-md:block");
    expect(html).toContain('data-cta-placement="dock"');
    expect(html).toContain("Free consult");
    expect(html).toContain("Book a session");
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
    const label = "Acceptance and commitment therapy (ACT)";
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
    const photoPhone = photo.slice(
      photo.indexOf('data-profile-layout="phone"'),
      photo.indexOf('data-profile-layout="desk"'),
    );
    expect(photoPhone.indexOf("https://example.com/photo.jpg")).toBeGreaterThan(
      photoPhone.indexOf("How Travis works"),
    );
    expect(photoPhone.indexOf("https://example.com/photo.jpg")).toBeLessThan(
      photoPhone.indexOf("Get to know"),
    );
    expect(photoPhone.slice(0, photoPhone.indexOf("How Travis works"))).not.toContain(
      "<img",
    );
    expect(photoPhone.indexOf("Education")).toBeLessThan(
      photoPhone.indexOf("Get to know"),
    );

    const video = render({ ...base, photoUrl: null });
    const videoPhone = video.slice(
      video.indexOf('data-profile-layout="phone"'),
      video.indexOf('data-profile-layout="desk"'),
    );
    const media = videoPhone.indexOf('data-profile-layout="media"');
    const phone = videoPhone.indexOf('data-profile-show="phone"');
    expect(videoPhone.slice(media, phone)).toContain("Play intro video");
    expect(videoPhone.slice(media, phone)).toContain("data-video-still");
    expect(video.match(/data-hero-media/g)).toHaveLength(2);
  });

  it("shows a soft pill when the practice is closed and nothing when it is open", () => {
    const open = render();
    expect(open).not.toContain(NOT_ACCEPTING_CLIENTS_LABEL);
    expect(open).not.toContain('data-accepting-clients="closed"');

    const html = render({ ...base, openToNewClients: false });
    const phoneTree = html.slice(
      html.indexOf('data-profile-layout="phone"'),
      html.indexOf('data-profile-layout="desk"'),
    );
    const deskTree = html.slice(html.indexOf('data-profile-layout="desk"'));

    expect(phoneTree.match(/data-accepting-clients="closed"/g)).toHaveLength(1);
    expect(deskTree.match(/data-accepting-clients="closed"/g)).toHaveLength(1);
    const phonePill = phoneTree.slice(
      phoneTree.indexOf('data-accepting-clients="closed"'),
      phoneTree.indexOf("</p>", phoneTree.indexOf('data-accepting-clients="closed"')),
    );
    expect(phonePill).toContain(NOT_ACCEPTING_CLIENTS_LABEL);
    expect(phonePill).toContain("bg-pill-bg");
    expect(phonePill).toContain("text-pill");
    expect(phoneTree.indexOf(NOT_ACCEPTING_CLIENTS_LABEL)).toBeLessThan(
      phoneTree.indexOf("How Travis works"),
    );
    const nameCard = deskTree.slice(
      deskTree.indexOf(">Travis White</h1>"),
      deskTree.indexOf('data-cta-placement="stack"'),
    );
    expect(nameCard).toContain(NOT_ACCEPTING_CLIENTS_LABEL);
    expect(nameCard).toContain("bg-pill-bg");
    expect(deskTree.indexOf("How Travis works")).toBeGreaterThan(
      deskTree.indexOf(NOT_ACCEPTING_CLIENTS_LABEL),
    );
    expect(deskTree.slice(deskTree.indexOf("How Travis works"))).not.toContain(
      NOT_ACCEPTING_CLIENTS_LABEL,
    );
  });
});
