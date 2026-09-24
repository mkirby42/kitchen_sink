export const REVIEW_QUESTIONS = [
  {
    key: "understood",
    column: "stars_cat_1",
    label: "Felt understood",
    question: "Do you feel understood?",
  },
  {
    key: "communication",
    column: "stars_cat_2",
    label: "Communication",
    question: "Does the therapist have good communication?",
  },
  {
    key: "fit",
    column: "stars_cat_3",
    label: "Right fit",
    question: "Do you feel like it was the right fit?",
  },
] as const;

export type ReviewRatingKey = (typeof REVIEW_QUESTIONS)[number]["key"];

export type ReviewRatings = Record<ReviewRatingKey, number | null>;

export type RequiredReviewRatings = Record<ReviewRatingKey, number>;
