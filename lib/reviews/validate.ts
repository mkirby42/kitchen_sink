export const REVIEW_BODY_MAX = 2000;
export const REVIEW_NAME_MAX = 80;

export type ReviewDraft = {
  authorName: string;
  anonymous: boolean;
  stars: number | null;
  body: string;
};

export type ValidReview = {
  authorName: string | null;
  anonymous: boolean;
  stars: number | null;
  body: string;
};

export function validateReview(
  draft: ReviewDraft,
): { ok: true; value: ValidReview } | { ok: false; error: string } {
  const body = draft.body.trim();
  if (!body) return { ok: false, error: "Write a short review." };
  if (body.length > REVIEW_BODY_MAX) {
    return { ok: false, error: "Keep the review under 2000 characters." };
  }

  const stars = draft.stars;
  if (
    stars != null &&
    (!Number.isInteger(stars) || stars < 1 || stars > 5)
  ) {
    return { ok: false, error: "Rating must be a whole number from 1 to 5." };
  }

  if (draft.anonymous) {
    return {
      ok: true,
      value: { authorName: null, anonymous: true, stars, body },
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
    value: { authorName, anonymous: false, stars, body },
  };
}
