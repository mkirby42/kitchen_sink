export function isPublishedReview(status: string | null | undefined) {
  return status !== "pending";
}

export function publishedReviews<T extends { status?: string | null }>(reviews: T[]) {
  return reviews.filter((review) => isPublishedReview(review.status));
}
