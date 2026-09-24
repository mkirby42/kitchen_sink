import type { ReviewViewer } from "@/lib/reviews/viewer";
import { reviewAuthorLabel, reviewMeta } from "@/lib/reviews/format";
import type { ProfileReview } from "@/lib/therapists/load";
import { ReviewComposer } from "./ReviewComposer";

export function ReviewsPanel({
  therapistId,
  reviews,
  average,
  viewer,
}: {
  therapistId: string;
  reviews: ProfileReview[];
  average: number | null;
  viewer: ReviewViewer;
}) {
  const canReview = !viewer.isOwner && viewer.role !== "therapist";
  const mine = reviews.find((review) => review.mine) ?? null;

  return (
    <div>
      {canReview ? (
        <ReviewComposer therapistId={therapistId} viewer={viewer} mine={mine} />
      ) : null}

      {reviews.length === 0 ? (
        <p className={canReview ? "mt-6 text-mute" : "text-mute"}>No reviews yet.</p>
      ) : (
        <div className={canReview ? "mt-8" : undefined}>
          <div className="flex items-end gap-3">
            {average != null ? (
              <p className="font-display text-5xl leading-none text-ink">{average}</p>
            ) : null}
            <div>
              {average != null ? <StarRow value={average} /> : null}
              <p className="text-sm text-mute">
                Based on {reviews.length} client{" "}
                {reviews.length === 1 ? "review" : "reviews"}
              </p>
            </div>
          </div>
          <ul className="mt-6 space-y-3">
            {reviews.map((review) => {
              const meta = reviewMeta(review);
              return (
                <li
                  key={review.id}
                  className="rounded-3xl bg-paper px-5 py-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-ink">{reviewAuthorLabel(review)}</p>
                    {review.stars != null ? <StarRow value={review.stars} /> : null}
                  </div>
                  {review.body ? (
                    <p className="mt-2 leading-relaxed text-ink">{review.body}</p>
                  ) : null}
                  {meta ? <p className="mt-3 text-sm text-mute">{meta}</p> : null}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function StarRow({ value }: { value: number }) {
  const filled = Math.round(value);
  return (
    <p className="text-clay" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (i < filled ? "★" : "☆")).join("")}
    </p>
  );
}
