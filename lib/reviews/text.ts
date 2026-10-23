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

/** Stored session format. "Virtual" is the old word; profiles say Online. */
export function publicSessionFormat(value: string | null | undefined) {
  const text = value?.trim() ?? "";
  if (!text) return null;
  if (text.toLowerCase() === "virtual") return "Online";
  return text;
}

export function reviewMeta(review: {
  session_format: string | null;
  duration_label: string | null;
  created_at: string;
}) {
  return [
    publicSessionFormat(review.session_format),
    review.duration_label,
    formatReviewDate(review.created_at),
  ]
    .filter(Boolean)
    .join(" · ");
}
