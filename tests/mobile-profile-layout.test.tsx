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

const license = "Licensed in Texas (#38047)";

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

function one(html: string) {
  const start = html.indexOf('data-profile-layout="one"');
  return html.slice(start);
}

describe("profile one-at-a-time layout", () => {
  it("uses the Find detail frame once, with fees and sections after the photo", () => {
    const html = render();
    expect(html.match(/data-profile-layout="one"/g)).toHaveLength(1);
    expect(html).not.toContain('data-profile-layout="phone"');
    expect(html).not.toContain('data-profile-layout="desk"');
    expect(html).not.toContain("data-extra-media");
    expect(html).not.toContain("data-license-badge");
    expect(html).not.toContain('data-prompt-variant="hinge"');
    expect(html).not.toContain("data-profile-photo");
    expect(html).not.toContain("1 min intro");
    expect(html.match(/data-find-stage/g)).toHaveLength(1);

    const page = one(html);
    const stage = page.indexOf("data-find-stage");
    const how = page.indexOf("How Travis works");
    const stageHtml = page.slice(stage, how);
    expect(stageHtml).toContain("https://example.com/photo.jpg");
    expect(stageHtml).toContain("object-cover");
    expect(stageHtml).toContain("Watch intro");
    expect(stageHtml).toContain('preload="none"');
    const scripted = withoutNoJsMedia(stageHtml);
    expect(scripted).toContain("https://example.com/photo.jpg");
    expect(scripted).not.toContain("intro.mp4");
    expect(scripted).not.toContain("data-video-still");

    const order = [
      license,
      "Education",
      "Doctor of Clinical Psychology",
      "Credentials",
      "Aetna",
      "1102 West 6th Street, Austin",
      "outside of session, I...",
      "How Travis works",
      "Areas of interest",
      "Approach in therapy",
      "Individual session (55 min)",
      "$150",
      "In Travis&#x27;s own words",
      "data-profile-switch",
    ];
    let at = stage;
    for (const label of order) {
      const next = page.indexOf(label, at);
      expect(next).toBeGreaterThan(at);
      at = next;
    }
    expect(page.indexOf("a session with me feels like...")).toBeGreaterThan(stage);
    expect(page.indexOf("a session with me feels like...")).toBeLessThan(
      page.indexOf(license),
    );
    expect(page).toContain("PsyD · Licensed psychologist");
    expect(page).toContain("8 yrs in practice");
    expect(page).toContain(">In person<");
    expect(page).toContain(">Online<");
    expect(page).not.toContain(">Virtual<");
    expect(page).not.toContain(">Office<");
    expect(page).not.toContain(">Identity<");
    expect(page).not.toContain("Get to know Travis");
    expect(page).toContain("I help people find their way.");
    expect(page).toContain("Cognitive behavioral therapy (CBT)");
    expect(page).toContain("Acceptance and commitment therapy (ACT)");
    expect(page).toContain("Life transitions");
    expect(page).toContain("bg-pill-bg");
    expect(page).not.toContain("How he");
    expect(page).not.toContain("Logistics");
    expect(page).not.toContain("♡");
    expect(page).not.toContain("Hinge");
    const inline = page.indexOf('data-cta-placement="inline"');
    const dock = page.indexOf('data-cta-placement="dock"');
    expect(page.indexOf("Free consult", inline)).toBeLessThan(
      page.indexOf("Book a session", inline),
    );
    expect(page.indexOf("Free consult", dock)).toBeLessThan(
      page.indexOf("Book a session", dock),
    );
    expect(html).not.toContain("lg:grid-cols-[minmax(0,26.5rem)_minmax(0,1fr)]");
  });

  it("wraps a long approach pill inside the profile column", () => {
    const page = one(render());
    const label = "Acceptance and commitment therapy (ACT)";
    const at = page.indexOf(label);
    expect(at).toBeGreaterThan(-1);
    const open = page.lastIndexOf("<li", at);
    const li = page.slice(open, page.indexOf(">", open));
    expect(li).toContain("max-w-full");
    expect(li).toContain("min-w-0");
    expect(li).toContain("whitespace-normal");
    expect(li).not.toContain("whitespace-nowrap");
  });

  it("keeps a photo-only frame and a video-only frame on that same stage", () => {
    const photo = render({ ...base, videoUrl: null });
    expect(photo.match(/data-find-stage/g)).toHaveLength(1);
    expect(photo).not.toContain("Watch intro");
    expect(photo).not.toContain("Play intro video");
    const photoPage = one(photo);
    expect(photoPage.indexOf("https://example.com/photo.jpg")).toBeLessThan(
      photoPage.indexOf("How Travis works"),
    );
    expect(photoPage).not.toContain("data-video-still");

    const video = one(render({ ...base, photoUrl: null }));
    const stage = video.indexOf("data-find-stage");
    const how = video.indexOf("How Travis works");
    const frame = video.slice(stage, how);
    expect(frame).toContain("Watch intro");
    expect(frame).toContain("data-video-still");
    expect(frame).toContain("intro.mp4#t=0.1");
    expect(frame).not.toContain("https://example.com/photo.jpg");
  });

  it("shows a soft pill when the practice is closed and nothing when it is open", () => {
    const open = render();
    expect(open).not.toContain(NOT_ACCEPTING_CLIENTS_LABEL);
    expect(open).not.toContain('data-accepting-clients="closed"');

    const html = render({ ...base, openToNewClients: false });
    const page = one(html);
    expect(page.match(/data-accepting-clients="closed"/g)).toHaveLength(1);
    const pill = page.slice(
      page.indexOf('data-accepting-clients="closed"'),
      page.indexOf("</p>", page.indexOf('data-accepting-clients="closed"')),
    );
    expect(pill).toContain(NOT_ACCEPTING_CLIENTS_LABEL);
    expect(pill).toContain("bg-pill-bg");
    expect(pill).toContain("text-pill");
    expect(page.indexOf(NOT_ACCEPTING_CLIENTS_LABEL)).toBeLessThan(
      page.indexOf("How Travis works"),
    );
    expect(page.indexOf(NOT_ACCEPTING_CLIENTS_LABEL)).toBeLessThan(
      page.indexOf("data-find-stage"),
    );
  });
});
