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

const visitor: ReviewViewer = { userId: null, role: null, isOwner: false };

const data: TherapistProfileData = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Maya Chen",
  givenName: "Maya",
  email: "maya@example.com",
  phone: null,
  about: "Warm, practical therapy.",
  photoUrl: null,
  videoUrl: null,
  voiceUrl: null,
  voicePrompt: null,
  credential: "LMFT",
  years: 9,
  virtual: true,
  inPerson: false,
  office: null,
  education: [],
  credentials: [],
  slidingScale: false,
  slidingScaleMinCents: null,
  slidingScaleMaxCents: null,
  superbill: false,
  licenses: [{ number: "1", state: "CA" }],
  rates: [{ service_type: "Individual", duration_minutes: 50, price_cents: 16500 }],
  tags: [],
  specialties: [],
  modalities: [],
  insurance: [],
  inNetwork: [],
  identity: [],
  cards: [
    {
      prompt: "who I work best with...",
      answer: "College students.",
      tag: "about",
    },
    {
      prompt: "before we start, you should know...",
      answer: "I take notes.",
      tag: "about",
    },
    {
      prompt: "clients say I'm especially good at...",
      answer: "Listening.",
      tag: "outcome",
    },
  ],
  reviews: [],
  pendingReview: null,
  contact: [],
  openToNewClients: true,
};

describe("public profile legacy cards", () => {
  it("shows stored labels for legacy work-best and retired prompts", () => {
    const html = renderToStaticMarkup(
      createElement(TherapistProfile, {
        data,
        backHref: routes.find,
        viewer: visitor,
      }),
    );
    expect(html).toContain("who I work best with...");
    expect(html).toContain("College students.");
    expect(html).toContain("before we start, you should know...");
    expect(html).toContain("I take notes.");
    expect(html).toContain("clients say I&#x27;m especially good at...");
    expect(html).toContain("Listening.");
    expect(html).not.toContain("I enjoy working with people who...");
    expect(html).not.toContain("data-profile-photo");
  });
});
