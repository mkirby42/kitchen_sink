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
  return [
    review.session_format,
    review.duration_label,
    formatReviewDate(review.created_at),
  ]
    .filter(Boolean)
    .join(" · ");
}
