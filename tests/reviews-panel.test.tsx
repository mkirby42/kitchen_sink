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
    understood: 5,
    communication: 5,
    fit: 4,
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
      therapistName: "Maya",
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
    expect(html).toContain("How was your session with ");
    expect(html).toContain(">Maya</em>?");
    expect(html).toContain("Your feedback helps other clients find the right fit.");
    expect(html).toContain("Sign in as a client to leave a review.");
    expect(html).not.toContain("Submit review");
  });

  it("lets a signed-in patient rate three questions, and still shows the empty state", () => {
    const html = render({ viewer: patient });
    expect(html).toContain("No reviews yet.");
    expect(html).toContain("Do you feel understood?");
    expect(html).toContain("Does the therapist have good communication?");
    expect(html).toContain("Do you feel like it was the right fit?");
    expect(html).toContain("Anything else you&#x27;d like to share?");
    expect(html).toContain("Optional — share as much or as little as you&#x27;d like.");
    expect(html).toContain("Submit review");
    expect(html).toContain("Post anonymously");
    expect(html).not.toContain("Rating, optional");
  });

  it("hides the form from any therapist, including one who does not own the profile", () => {
    const html = render({
      viewer: { userId: "therapist-2", role: "therapist", isOwner: false },
    });
    expect(html).toContain("No reviews yet.");
    expect(html).not.toContain("Submit review");
    expect(html).not.toContain("Do you feel understood?");
  });

  it("lets an admin review someone else's open profile", () => {
    const html = render({
      viewer: { userId: "admin-1", role: "admin", isOwner: false },
    });
    expect(html).toContain("Submit review");
    expect(html).toContain("Do you feel understood?");
    expect(html).toContain("No reviews yet.");
  });

  it("hides the form when the admin is reviewing their own test profile", () => {
    const html = render({
      viewer: { userId: "admin-1", role: "admin", isOwner: true },
    });
    expect(html).toContain("No reviews yet.");
    expect(html).not.toContain("Submit review");
    expect(html).not.toContain("How was your session");
  });

  it("hides the form from the therapist who owns the profile", () => {
    const html = render({ viewer: therapist });
    expect(html).toContain("No reviews yet.");
    expect(html).not.toContain("Submit review");
    expect(html).not.toContain("How was your session");
    expect(html).not.toContain("Sign in as a client");
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
    expect(html).toContain("5.0");
    expect(html).toContain("Felt understood");
    expect(html).toContain("Communication");
    expect(html).toContain("Right fit");
    expect(html).toContain("4.0");
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
          understood: null,
          communication: null,
          fit: null,
          mine: true,
          body: "Quietly helpful.",
        }),
      ],
    });
    expect(html).toContain("Anonymous");
    expect(html).not.toContain("J. R.");
    expect(html).toContain("Submit review");
    expect(html).toContain("Quietly helpful.");
    expect(html).toContain("Remove");
    expect(html).not.toContain("Felt understood");
  });

  it("shows the prototype category split across three reviews", () => {
    const html = render({
      viewer: therapist,
      average: 4.7,
      reviews: [
        review({ id: "a", understood: 5, communication: 5, fit: 5, stars: 5 }),
        review({ id: "b", understood: 5, communication: 5, fit: 4, stars: 14 / 3 }),
        review({ id: "c", understood: 4, communication: 5, fit: 4, stars: 13 / 3 }),
      ],
    });
    expect(html).toContain("4.7");
    expect(html).toContain("5.0");
    expect(html).toContain("4.3");
    expect(html).toContain("Based on 3 client reviews");
  });
});
