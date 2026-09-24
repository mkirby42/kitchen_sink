import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh() {}, push() {}, replace() {} }),
}));

import { ReviewsPanel } from "@/components/profile/ReviewsPanel";
import type { ReviewViewer } from "@/lib/reviews/viewer";
import type { ProfileReview } from "@/lib/therapists/load";

const visitor: ReviewViewer = {
  userId: null,
  role: null,
  isOwner: false,
};

const patient: ReviewViewer = {
  userId: "patient-1",
  role: "patient",
  isOwner: false,
};

const therapist: ReviewViewer = {
  userId: "therapist-1",
  role: "therapist",
  isOwner: true,
};

function review(overrides: Partial<ProfileReview> = {}): ProfileReview {
  return {
    id: "rev-1",
    stars: 5,
    body: "She listened.",
    session_format: "Virtual",
    duration_label: "8 months with Maya",
    reviewer_name: "J. R.",
    anonymous: false,
    created_at: "2026-03-01T15:00:00.000Z",
    mine: false,
    ...overrides,
  };
}

function render(props: {
  reviews?: ProfileReview[];
  viewer?: ReviewViewer;
  average?: number | null;
}) {
  return renderToStaticMarkup(
    createElement(ReviewsPanel, {
      therapistId: "therapist-1",
      reviews: props.reviews ?? [],
      average: props.average ?? null,
      viewer: props.viewer ?? visitor,
    }),
  );
}

describe("ReviewsPanel", () => {
  it("keeps the empty state and asks a visitor to sign in", () => {
    const html = render({});
    expect(html).toContain("No reviews yet.");
    expect(html).toContain("Sign in to post under your name, or anonymously.");
    expect(html).not.toContain("Post review");
  });

  it("lets a signed-in patient post, and still shows the empty state", () => {
    const html = render({ viewer: patient });
    expect(html).toContain("No reviews yet.");
    expect(html).toContain("Post review");
    expect(html).toContain("Display name");
    expect(html).toContain("Post anonymously");
    expect(html).toContain("Rating, optional");
  });

  it("hides the form from the therapist who owns the profile", () => {
    const html = render({ viewer: therapist });
    expect(html).toContain("No reviews yet.");
    expect(html).not.toContain("Post review");
    expect(html).not.toContain("Sign in to post");
  });

  it("lists a review with the author, stars, and date", () => {
    const html = render({
      viewer: therapist,
      average: 5,
      reviews: [review()],
    });
    expect(html).toContain("J. R.");
    expect(html).toContain("She listened.");
    expect(html).toContain("★★★★★");
    expect(html).toContain("Based on 1 client review");
    expect(html).toContain("Virtual · 8 months with Maya · ");
    expect(html).not.toContain("No reviews yet.");
  });

  it("shows Anonymous and an update form for the author's own review", () => {
    const html = render({
      viewer: patient,
      average: null,
      reviews: [
        review({
          anonymous: true,
          reviewer_name: null,
          stars: null,
          mine: true,
          body: "Quietly helpful.",
        }),
      ],
    });
    expect(html).toContain("Anonymous");
    expect(html).not.toContain("J. R.");
    expect(html).toContain("Update review");
    expect(html).toContain("Quietly helpful.");
    expect(html).toContain("Remove");
  });
});
