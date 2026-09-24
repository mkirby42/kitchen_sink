import { reviewAverage, type ProfileReview } from "@/lib/therapists/load";
import { REVIEW_QUESTIONS, type ReviewRatingKey } from "./questions";

export function formatRating(value: number) {
  return value.toFixed(1);
}

export function categoryAverages(
  reviews: Pick<ProfileReview, ReviewRatingKey>[],
) {
  return REVIEW_QUESTIONS.map((question) => {
    const values = reviews
      .map((review) => review[question.key])
      .filter((n): n is number => n != null);
    return {
      key: question.key,
      label: question.label,
      average: reviewAverage(values),
    };
  });
}

export function formatReviewDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function reviewAuthorLabel(review: {
  anonymous: boolean;
  reviewer_name: string | null;
}) {
  if (review.anonymous) return "Anonymous";
  const name = review.reviewer_name?.trim();
  return name || "Client";
}

export function reviewMeta(review: {
  session_format: string | null;
  duration_label: string | null;
  created_at: string;
}) {
  return [review.session_format, review.duration_label, formatReviewDate(review.created_at)]
    .filter(Boolean)
    .join(" · ");
}
