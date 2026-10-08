"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Notice } from "@/components/ui/Notice";
import { tagClass, textLinkClass } from "@/components/ui/styles";
import {
  approveReview,
  rejectReview,
  type PendingReview,
} from "@/lib/admin/reviews";
import { formatReviewDate } from "@/lib/reviews/text";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Couldn't update that review.";
}

export function ReviewQueue({ reviews }: { reviews: PendingReview[] }) {
  const router = useRouter();
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const rows = reviews.filter((review) => !hiddenIds.includes(review.id));

  async function run(id: string, action: "approve" | "reject") {
    setError("");
    setBusyId(id);
    try {
      const supabase = createClient();
      if (action === "approve") await approveReview(supabase, id);
      else await rejectReview(supabase, id);
      setHiddenIds((current) => [...current, id]);
      router.refresh();
    } catch (actionError) {
      setError(errorMessage(actionError));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Eyebrow>Ops</Eyebrow>
      <h1 className="mt-1 font-display text-2xl leading-snug tracking-tight text-clay">
        Review queue
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-mute">
        New client reviews stay here until you approve them. Approving posts
        the review on the therapist profile. Rejecting deletes it. Rejected
        reviews are not kept.
      </p>

      {rows.length === 0 ? (
        <Card className="mt-6 px-4 py-3">
          <p className="text-sm text-mute">No reviews waiting.</p>
        </Card>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((review) => {
            const date = formatReviewDate(review.createdAt);
            const busy = busyId === review.id;
            return (
              <Card as="li" key={review.id} className="px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{review.authorLabel}</p>
                    <p className="mt-1 text-sm text-mute">
                      For{" "}
                      <Link
                        href={routes.therapist(review.therapistId)}
                        className={textLinkClass}
                      >
                        {review.therapistName}
                      </Link>
                      {date ? ` · ${date}` : ""}
                    </p>
                  </div>
                  <span className={tagClass(false)}>Pending</span>
                </div>
                <ul className="mt-3 flex flex-wrap gap-2">
                  <li className={tagClass(false)}>
                    Understood {review.understood ?? "—"}
                  </li>
                  <li className={tagClass(false)}>
                    Communication {review.communication ?? "—"}
                  </li>
                  <li className={tagClass(false)}>Fit {review.fit ?? "—"}</li>
                </ul>
                {review.body ? (
                  <p className="mt-3 leading-relaxed whitespace-pre-wrap text-ink">
                    {review.body}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-mute">No written note.</p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={busyId !== null}
                    onClick={() => void run(review.id, "approve")}
                  >
                    {busy ? "Please wait…" : "Approve"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={busyId !== null}
                    onClick={() => void run(review.id, "reject")}
                  >
                    Reject and delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </ul>
      )}

      {error ? (
        <div className="mt-4">
          <Notice role="alert">{error}</Notice>
        </div>
      ) : null}
    </main>
  );
}
