import { reviewAverage, type ProfileReview } from "@/lib/therapists/load";
import { REVIEW_QUESTIONS, type ReviewRatingKey } from "./questions";

export { formatReviewDate, reviewAuthorLabel, reviewMeta } from "./text";

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

