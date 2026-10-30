// Product-decision guard. Do not weaken this file to make CI pass.
// See docs/product-decisions.md.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh() {}, push() {}, replace() {} }),
}));

import { ContactSheet } from "@/components/profile/ContactSheet";
import { TherapistProfile } from "@/components/profile/TherapistProfile";
import { TRAVIS_PROFILE_ID } from "@/lib/profile/public-facts";
import type { ReviewViewer } from "@/lib/reviews/viewer";
import { routes } from "@/lib/routes";
import type { TherapistProfileData } from "@/lib/therapists/load";

const visitor: ReviewViewer = { userId: null, role: null, isOwner: false };

const data: TherapistProfileData = {
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
  slidingScale: true,
  slidingScaleMinCents: null,
  slidingScaleMaxCents: null,
  superbill: true,
  licenses: [{ number: "38047", state: "TX" }],
  rates: [{ service_type: "Individual", duration_minutes: 55, price_cents: 15000 }],
  tags: [],
  specialties: ["Anxiety", "Life Transitions"],
  modalities: ["CBT"],
  insurance: ["Aetna", "Out-of-Network Superbill"],
  inNetwork: ["Aetna"],
  identity: ["BIPOC"],
  cards: [
    {
      prompt: "a session with me feels like...",
      answer: "It is just two people talking.",
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

function render(profile: TherapistProfileData, viewer: ReviewViewer) {
  return renderToStaticMarkup(
    createElement(TherapistProfile, {
      data: profile,
      backHref: routes.find,
      viewer,
    }),
  );
}

function profileSlice(html: string) {
  const start = html.indexOf('data-profile-layout="one"');
  expect(start).toBeGreaterThan(-1);
  return html.slice(start);
}

describe("profile guards", () => {
  it("uses the Find detail frame, sections, and fees on one layout", () => {
    const html = render(data, visitor);
    expect(html).not.toContain('data-profile-layout="phone"');
    expect(html).not.toContain('data-profile-layout="desk"');
    expect(html).not.toContain("1 min intro");
    expect(html).not.toContain("data-profile-photo");
    const page = profileSlice(html);
    const stage = page.indexOf("data-find-stage");
    expect(stage).toBeGreaterThan(-1);
    const stageHtml = page.slice(stage, page.indexOf("How Travis works"));
    expect(stageHtml).toContain("https://example.com/photo.jpg");
    expect(stageHtml).toContain("object-cover");
    expect(stageHtml).toContain("Watch intro");
    expect(stageHtml).toContain('preload="none"');
    expect(page.indexOf(">Travis White<")).toBeLessThan(stage);

    const order = [
      "a session with me feels like...",
      "Licensed in Texas (#38047)",
      "Education",
      "Doctor of Clinical Psychology",
      "Credentials",
      "Aetna",
      "How Travis works",
      "Areas of interest",
      "Approach in therapy",
      "Individual session (55 min)",
      "In Travis&#x27;s own words",
    ];
    let at = -1;
    for (const label of order) {
      const next = page.indexOf(label);
      expect(next).toBeGreaterThan(at);
      at = next;
    }
    expect(page).toContain("PsyD · Licensed psychologist");
    expect(page).toContain("8 yrs in practice");
    expect(page).not.toContain(">Identity<");
    expect(page).toContain("1102 West 6th Street, Austin");
    expect(page).toContain("Cognitive behavioral therapy (CBT)");
    expect(page).not.toContain("BIPOC");
    expect(page).toContain("$150");
    expect(page).toContain("Sliding scale");
    expect(page).toContain("Available");
    expect(page).toContain("break-words");
    expect(page).toContain("whitespace-normal");
    expect(page).not.toContain("Not accepting new clients");
    expect(page).not.toContain("Get to know Travis");
  });

  it("omits education on Travis White's public profile and still shows credentials", () => {
    const html = render({ ...data, id: TRAVIS_PROFILE_ID }, visitor);
    expect(html).not.toContain("Education");
    expect(html).not.toContain("Doctor of Clinical Psychology");
    expect(html).toContain("Credentials");
    expect(html).toContain("Licensed psychologist");
    expect(html).not.toContain(">Identity<");
    expect(html).not.toContain("BIPOC");
  });

  it("says Not accepting new clients only when the practice is closed", () => {
    const html = render({ ...data, openToNewClients: false }, visitor);
    expect(html).toContain("Not accepting new clients");
  });

  it("pins Free consult and Book a session and does not link them to mail", () => {
    const html = render(data, visitor);
    expect(html).toContain("Free consult");
    expect(html).toContain("Book a session");
    expect(html).toContain('data-cta-placement="dock"');
    expect(html).toContain('data-cta-placement="inline"');
    const dock = html.indexOf('data-cta-placement="dock"');
    const inline = html.indexOf('data-cta-placement="inline"');
    expect(html.indexOf("Free consult", dock)).toBeLessThan(
      html.indexOf("Book a session", dock),
    );
    expect(html.indexOf("Free consult", inline)).toBeLessThan(
      html.indexOf("Book a session", inline),
    );
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).not.toContain("mailto:");
    expect(html).not.toContain("tel:");
  });

  it("opens Reach {name} from the contact sheet", () => {
    const html = renderToStaticMarkup(
      createElement(ContactSheet, {
        open: true,
        name: "Travis White",
        onClose() {},
        contact: data.contact,
      }),
    );
    expect(html).toContain("Reach Travis White");
    expect(html).toContain("Kitchen Sink doesn&#x27;t book sessions");
    expect(html).toContain('href="mailto:travis@example.com"');
    expect(html).toContain('href="tel:+15125550199"');
    expect(html).toContain("Email");
    expect(html).toContain("Call");
  });

  it("shows Edit and Delete to the owner only", () => {
    const owner = render(data, {
      userId: data.id,
      role: "therapist",
      isOwner: true,
    });
    expect(owner).toContain("Edit profile");
    expect(owner).toContain("Delete profile");
    expect(owner).toContain("Back to search");
    const guest = render(data, visitor);
    expect(guest).not.toContain("Edit profile");
    expect(guest).not.toContain("Delete profile");
    expect(guest).not.toContain("Hidden (admin only)");
  });

  it("offers Hidden (admin only) only in admin view", () => {
    const admin = renderToStaticMarkup(
      createElement(TherapistProfile, {
        data,
        backHref: routes.find,
        viewer: { userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", role: "admin", isOwner: false },
        canHideListing: true,
      }),
    );
    expect(admin).toContain("Hidden (admin only)");
    expect(admin).toContain('aria-pressed="false"');
    expect(admin).toContain("Edit profile");
    const hidden = renderToStaticMarkup(
      createElement(TherapistProfile, {
        data: { ...data, hiddenFromPublic: true },
        backHref: routes.find,
        viewer: { userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", role: "admin", isOwner: false },
        canHideListing: true,
      }),
    );
    expect(hidden).toContain('aria-pressed="true"');
    expect(hidden).toContain("Admin only — hidden from public");
    const owner = render(data, {
      userId: data.id,
      role: "therapist",
      isOwner: true,
    });
    expect(owner).not.toContain("Hidden (admin only)");
  });
});
