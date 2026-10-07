import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TherapistProfile } from "@/components/profile/TherapistProfile";
import type { ReviewViewer } from "@/lib/reviews/viewer";
import { routes } from "@/lib/routes";
import type { TherapistProfileData } from "@/lib/therapists/load";
import { ADMIN_ONLY_HIDDEN_LABEL } from "@/lib/therapists/listing";

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
    office: null,
    education: ["B.A. Psychology"],
    credentials: ["EMDR trained"],
  slidingScale: false,
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
  pendingReview: null,
  contact: [],
};

const owner: ReviewViewer = {
  userId: data.id,
  role: "therapist",
  isOwner: true,
};

const visitor: ReviewViewer = {
  userId: null,
  role: null,
  isOwner: false,
};

describe("profile edit control", () => {
  it("banners a hidden profile and stays quiet on a public one", () => {
    const hidden = renderToStaticMarkup(
      createElement(TherapistProfile, {
        data: { ...data, hiddenFromPublic: true },
        backHref: routes.find,
        viewer: visitor,
      }),
    );
    const listed = renderToStaticMarkup(
      createElement(TherapistProfile, {
        data,
        backHref: routes.find,
        viewer: visitor,
      }),
    );
    expect(hidden).toContain(ADMIN_ONLY_HIDDEN_LABEL);
    expect(listed).not.toContain(ADMIN_ONLY_HIDDEN_LABEL);
  });

  it("shows an Edit button for the owner in the header corner", () => {
    const html = renderToStaticMarkup(
      createElement(TherapistProfile, {
        data,
        backHref: routes.find,
        viewer: owner,
      }),
    );
    expect(html).toContain("Edit profile");
    expect(html).toContain("B.A. Psychology");
    expect(html).toContain("EMDR trained");
    expect(html).not.toContain("Practicing under supervision");
    expect(html).not.toContain("I'm interested");
    expect(html).toContain(routes.joinEdit);
    expect(html).not.toContain("Delete profile");
  });

  it("keeps rates and insurance in the lower box and drops the top summary cards", () => {
    const ranged = renderToStaticMarkup(
      createElement(TherapistProfile, {
        data: {
          ...data,
          rates: [
            {
              service_type: "Individual",
              duration_minutes: 50,
              price_cents: 16500,
            },
          ],
          slidingScale: true,
          slidingScaleMinCents: 9000,
          slidingScaleMaxCents: 12000,
          insurance: ["Aetna", "BCBS", "Out-of-Network Superbill"],
          inNetwork: ["Aetna", "BCBS"],
          superbill: true,
        },
        backHref: routes.find,
        viewer: visitor,
      }),
    );
    expect(ranged).not.toContain("Cash pay fee");
    expect(ranged).not.toContain(">Insurance<");
    expect(ranged).not.toContain("sliding scale available");
    expect(ranged).not.toContain("+ out-of-network superbills");
    expect(ranged).not.toContain("Aetna, BCBS");
    expect(ranged).toContain("Logistics");
    expect(ranged).not.toContain("Rates &amp; insurance");
    expect(ranged).toContain("Individual session (50 min)");
    expect(ranged).toContain("$165");
    expect(ranged).toContain("Sliding scale");
    expect(ranged).toContain("$90-120");
    expect(ranged).toContain("Aetna · BCBS");
    expect(ranged).toContain("Superbill provided");

    const bare = renderToStaticMarkup(
      createElement(TherapistProfile, {
        data: {
          ...data,
          slidingScale: true,
          slidingScaleMinCents: null,
          slidingScaleMaxCents: null,
        },
        backHref: routes.find,
        viewer: visitor,
      }),
    );
    expect(bare).not.toContain("Cash pay fee");
    expect(bare).toContain("Sliding scale");
    expect(bare).toContain("Available");

    const off = renderToStaticMarkup(
      createElement(TherapistProfile, {
        data,
        backHref: routes.find,
        viewer: visitor,
      }),
    );
    expect(off).not.toContain("sliding scale available");
    expect(off).not.toContain("Cash pay fee");
    expect(off).not.toContain(">Insurance<");
    expect(off).toContain("In-network");
    expect(off).toContain("None listed");
  });

  it("hides Edit from visitors", () => {
    const html = renderToStaticMarkup(
      createElement(TherapistProfile, {
        data,
        backHref: routes.find,
        viewer: visitor,
      }),
    );
    expect(html).not.toContain("Edit profile");
    expect(html).not.toContain("I'm interested");
    expect(html).not.toContain(routes.joinEdit);
    expect(html).not.toContain("Delete profile");
    expect(html).not.toContain("Office");
  });

  it("shows a saved office address for in-person therapists", () => {
    const html = renderToStaticMarkup(
      createElement(TherapistProfile, {
        data: {
          ...data,
          virtual: true,
          inPerson: true,
          office: {
            address: "1102 West 6th Street, Austin",
            address2: "Suite 4",
            state: "TX",
            zip: "78703",
          },
        },
        backHref: routes.find,
        viewer: visitor,
      }),
    );
    expect(html).toContain("Logistics");
    expect(html).not.toContain("Rates &amp; insurance");
    expect(html).not.toContain(">Office<");
    expect(html).not.toContain("Virtual &amp; In-Person");
    expect(html).not.toContain("In-Person");
    const logisticsAt = html.indexOf("Logistics");
    const inPersonAt = html.indexOf(">In person</li>");
    const virtualAt = html.indexOf(">Virtual</li>");
    const addressAt = html.indexOf("1102 West 6th Street, Austin");
    expect(inPersonAt).toBeGreaterThan(logisticsAt);
    expect(virtualAt).toBeGreaterThan(inPersonAt);
    expect(addressAt).toBeGreaterThan(logisticsAt);
    expect(html.indexOf("1102 West 6th Street, Austin", addressAt + 1)).toBe(
      -1,
    );
    expect(html).toContain("Suite 4");
    expect(html).toContain("TX 78703");
  });

  it("omits the office block when no address is saved", () => {
    const html = renderToStaticMarkup(
      createElement(TherapistProfile, {
        data: {
          ...data,
          inPerson: true,
          office: null,
        },
        backHref: routes.find,
        viewer: visitor,
      }),
    );
    expect(html).not.toContain(">Office<");
    expect(html).not.toContain("1102 West 6th Street");
    expect(html).toContain(">In person</li>");
    expect(html).toContain(">Virtual</li>");
    expect(html).toContain("Education");
    expect(html).toContain("Logistics");
  });

  it("hides a leftover address when the therapist is virtual only", () => {
    const html = renderToStaticMarkup(
      createElement(TherapistProfile, {
        data: {
          ...data,
          virtual: true,
          inPerson: false,
          office: {
            address: "1102 West 6th Street, Austin",
            address2: null,
            state: "TX",
            zip: "78703",
          },
        },
        backHref: routes.find,
        viewer: visitor,
      }),
    );
    expect(html).not.toContain(">Office<");
    expect(html).not.toContain("1102 West 6th Street");
    expect(html).toContain(">Virtual</li>");
    expect(html).not.toContain(">In person</li>");
    expect(html).toContain("Logistics");
  });

  it("titles modalities above specialties, both below education", () => {
    const html = renderToStaticMarkup(
      createElement(TherapistProfile, {
        data: {
          ...data,
          specialties: ["Anxiety", "Trauma & PTSD"],
          modalities: ["CBT", "EMDR"],
        },
        backHref: routes.find,
        viewer: visitor,
      }),
    );
    const education = html.indexOf("Education");
    const modalities = html.indexOf("Modalities");
    const specialties = html.indexOf("Specialties");
    const heroDetails = html.indexOf("data-hero-details");
    expect(education).toBeGreaterThan(-1);
    expect(modalities).toBeGreaterThan(education);
    expect(specialties).toBeGreaterThan(modalities);
    expect(html.indexOf("CBT")).toBeGreaterThan(modalities);
    expect(html.indexOf("CBT")).toBeLessThan(specialties);
    expect(html.indexOf("Anxiety")).toBeGreaterThan(specialties);
    expect(html.slice(heroDetails, education)).not.toContain("CBT");
    expect(html.slice(heroDetails, education)).not.toContain("EMDR");
  });

  it("keeps the modality and specialty boxes when education is empty", () => {
    const html = renderToStaticMarkup(
      createElement(TherapistProfile, {
        data: {
          ...data,
          education: [],
          credentials: [],
          specialties: ["Anxiety"],
          modalities: ["CBT"],
        },
        backHref: routes.find,
        viewer: visitor,
      }),
    );
    expect(html).not.toContain("Education");
    expect(html).not.toContain("Credentials");
    const modalities = html.indexOf("Modalities");
    const specialties = html.indexOf("Specialties");
    expect(modalities).toBeGreaterThan(-1);
    expect(specialties).toBeGreaterThan(modalities);
  });
});
