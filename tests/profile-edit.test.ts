import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TherapistProfile } from "@/components/profile/TherapistProfile";
import { routes } from "@/lib/routes";
import type { TherapistProfileData } from "@/lib/therapists/load";

const data: TherapistProfileData = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Maya Chen",
  givenName: "Maya",
  email: "maya@example.com",
  phone: null,
  about: null,
  photoUrl: null,
  videoUrl: null,
  credential: "LMFT",
  years: 9,
    virtual: true,
    inPerson: false,
    education: ["B.A. Psychology"],
    credentials: ["EMDR trained"],
  slidingScaleMinCents: null,
  slidingScaleMaxCents: null,
  superbill: false,
  licenses: [],
  rates: [],
  tags: [],
  specialties: [],
  modalities: [],
  insurance: [],
  inNetwork: [],
  identity: [],
  cards: [],
  reviews: [],
  contact: [],
};

describe("profile edit control", () => {
  it("shows an Edit button for the owner in the header corner", () => {
    const html = renderToStaticMarkup(
      createElement(TherapistProfile, {
        data,
        backHref: routes.find,
        isOwner: true,
      }),
    );
    expect(html).toContain("Edit profile");
    expect(html).toContain("B.A. Psychology");
    expect(html).toContain("EMDR trained");
    expect(html).not.toContain("Practicing under supervision");
    expect(html).not.toContain("I'm interested");
    expect(html).toContain(routes.joinEdit);
  });

  it("hides Edit from visitors", () => {
    const html = renderToStaticMarkup(
      createElement(TherapistProfile, {
        data,
        backHref: routes.find,
        isOwner: false,
      }),
    );
    expect(html).not.toContain("Edit profile");
    expect(html).not.toContain("I'm interested");
    expect(html).not.toContain(routes.joinEdit);
  });
});
