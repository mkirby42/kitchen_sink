"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-semibold tracking-[0.2em] text-clay uppercase">
        Ops
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight">Review queue</h1>
      <p className="mt-4 max-w-xl text-mute">
        New client reviews stay here until you approve them. Approving posts
        the review on the therapist profile. Rejecting deletes it. Rejected
        reviews are not kept.
      </p>

      {rows.length === 0 ? (
        <p className="mt-8 text-sm text-mute">No reviews waiting.</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {rows.map((review) => {
            const date = formatReviewDate(review.createdAt);
            const busy = busyId === review.id;
            return (
              <li key={review.id} className="rounded-[1.75rem] bg-paper px-5 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">{review.authorLabel}</p>
                    <p className="mt-1 text-sm text-mute">
                      For{" "}
                      <Link
                        href={routes.therapist(review.therapistId)}
                        className="font-medium text-clay hover:text-clay-dark"
                      >
                        {review.therapistName}
                      </Link>
                      {date ? ` · ${date}` : ""}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-ink">
                  Understood {review.understood ?? "—"} · Communication{" "}
                  {review.communication ?? "—"} · Fit {review.fit ?? "—"}
                </p>
                {review.body ? (
                  <p className="mt-3 leading-relaxed whitespace-pre-wrap text-ink">
                    {review.body}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-mute">No written note.</p>
                )}
                <div className="mt-5 flex items-center gap-4">
                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => void run(review.id, "approve")}
                    className="rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-paper hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? "Please wait…" : "Approve"}
                  </button>
                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => void run(review.id, "reject")}
                    className="text-sm font-semibold text-mute hover:text-clay-dark disabled:opacity-50"
                  >
                    Reject and delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {error ? (
        <p role="alert" className="mt-6 rounded-2xl bg-paper px-5 py-4 text-sm text-clay-dark">
          {error}
        </p>
      ) : null}
    </main>
  );
}
