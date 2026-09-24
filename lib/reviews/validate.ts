import type { RequiredReviewRatings, ReviewRatings } from "./questions";

export const REVIEW_BODY_MAX = 2000;
export const REVIEW_NAME_MAX = 80;

export type ReviewDraft = {
  authorName: string;
  anonymous: boolean;
  ratings: ReviewRatings;
  body: string;
};

export type ValidReview = {
  authorName: string | null;
  anonymous: boolean;
  ratings: RequiredReviewRatings;
  body: string | null;
};

function wholeStar(value: number | null): value is number {
  return value != null && Number.isInteger(value) && value >= 1 && value <= 5;
}

export function validateReview(
  draft: ReviewDraft,
): { ok: true; value: ValidReview } | { ok: false; error: string } {
  const body = draft.body.trim();
  if (body.length > REVIEW_BODY_MAX) {
    return { ok: false, error: "Keep the review under 2000 characters." };
  }

  const understood = draft.ratings.understood;
  const communication = draft.ratings.communication;
  const fit = draft.ratings.fit;
  if (!wholeStar(understood) || !wholeStar(communication) || !wholeStar(fit)) {
    return { ok: false, error: "Rate all three questions from 1 to 5." };
  }

  const ratings = { understood, communication, fit };

  if (draft.anonymous) {
    return {
      ok: true,
      value: { authorName: null, anonymous: true, ratings, body: body || null },
    };
  }

  const authorName = draft.authorName.trim();
  if (!authorName) {
    return { ok: false, error: "Add a display name, or post anonymously." };
  }
  if (authorName.length > REVIEW_NAME_MAX) {
    return { ok: false, error: "Display name must be 80 characters or fewer." };
  }

  return {
    ok: true,
    value: { authorName, anonymous: false, ratings, body: body || null },
  };
}
