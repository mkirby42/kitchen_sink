import { categoryAverages, formatRating, reviewAuthorLabel, reviewMeta } from "@/lib/reviews/format";
import type { ReviewViewer } from "@/lib/reviews/viewer";
import type { ProfileReview } from "@/lib/therapists/load";
import { ReviewComposer } from "./ReviewComposer";

export function ReviewsPanel({
  therapistId,
  therapistName,
  reviews,
  average,
  viewer,
}: {
  therapistId: string;
  therapistName: string;
  reviews: ProfileReview[];
  average: number | null;
  viewer: ReviewViewer;
}) {
  const canReview = !viewer.isOwner && viewer.role !== "therapist";
  const mine = reviews.find((review) => review.mine) ?? null;
  const categories = categoryAverages(reviews).filter((row) => row.average != null);

  return (
    <div>
      {canReview ? (
        <ReviewComposer
          therapistId={therapistId}
          therapistName={therapistName}
          viewer={viewer}
          mine={mine}
        />
      ) : null}

      {reviews.length === 0 ? (
        <p className={canReview ? "mt-6 text-mute" : "text-mute"}>No reviews yet.</p>
      ) : (
        <div className={canReview ? "mt-10" : undefined}>
          <div className="flex items-end gap-3">
            {average != null ? (
              <p className="font-display text-5xl leading-none text-ink">
                {formatRating(average)}
              </p>
            ) : null}
            <div>
              {average != null ? <StarRow value={average} /> : null}
              <p className="text-sm text-mute">
                Based on {reviews.length} client{" "}
                {reviews.length === 1 ? "review" : "reviews"}
              </p>
            </div>
          </div>
          {categories.length > 0 ? (
            <ul className="mt-6 space-y-4">
              {categories.map((row) => (
                <li key={row.key}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-ink">{row.label}</span>
                    <span className="font-medium text-ink">
                      {formatRating(row.average ?? 0)}
                    </span>
                  </div>
                  <div
                    className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line"
                    role="img"
                    aria-label={`${row.label} ${formatRating(row.average ?? 0)} out of 5`}
                  >
                    <div
                      className="h-full rounded-full bg-clay"
                      style={{ width: `${((row.average ?? 0) / 5) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
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
