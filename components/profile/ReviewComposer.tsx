"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReviewViewer } from "@/lib/reviews/viewer";
import type { ProfileReview } from "@/lib/therapists/load";
import { createClient } from "@/lib/supabase/client";
import { deleteOwnReview, submitReview } from "@/lib/reviews/submit";
import { FormMessage, ReviewAuth } from "./ReviewAuth";

export function ReviewComposer({
  therapistId,
  viewer,
  mine,
}: {
  therapistId: string;
  viewer: ReviewViewer;
  mine: ProfileReview | null;
}) {
  if (!viewer.userId) return <ReviewAuth />;
  return <ReviewForm therapistId={therapistId} mine={mine} />;
}

function ReviewForm({
  therapistId,
  mine,
}: {
  therapistId: string;
  mine: ProfileReview | null;
}) {
  const router = useRouter();
  const [authorName, setAuthorName] = useState(
    mine && !mine.anonymous ? (mine.reviewer_name ?? "") : "",
  );
  const [anonymous, setAnonymous] = useState(mine?.anonymous ?? false);
  const [stars, setStars] = useState<number | null>(mine?.stars ?? null);
  const [body, setBody] = useState(mine?.body ?? "");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);
    try {
      const supabase = createClient();
      await submitReview(supabase, therapistId, {
        authorName,
        anonymous,
        stars,
        body,
      });
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Couldn't post that review.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function onRemove() {
    setMessage("");
    setSubmitting(true);
    try {
      const supabase = createClient();
      await deleteOwnReview(supabase, therapistId);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Couldn't remove that review.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl bg-paper px-5 py-5 shadow-sm">
      <p className="text-[11px] font-semibold tracking-[0.14em] text-clay uppercase">
        {mine ? "Your review" : "Leave a review"}
      </p>

      <label className="mt-4 block">
        <span className="text-xs font-semibold tracking-[0.16em] text-mute uppercase">
          Display name
        </span>
        <input
          type="text"
          value={authorName}
          maxLength={80}
          disabled={anonymous}
          required={!anonymous}
          autoComplete="nickname"
          onChange={(event) => setAuthorName(event.target.value)}
          className="mt-1.5 w-full border-0 border-b border-line bg-transparent px-0 py-2 text-base outline-none focus:border-clay disabled:opacity-40"
        />
      </label>

      <label className="mt-3 flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={anonymous}
          onChange={(event) => setAnonymous(event.target.checked)}
          className="accent-clay"
        />
        Post anonymously
      </label>

      <fieldset className="mt-4">
        <legend className="text-xs font-semibold tracking-[0.16em] text-mute uppercase">
          Rating, optional
        </legend>
        <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((value) => {
            const filled = stars != null && value <= stars;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={stars === value}
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
                onClick={() => setStars(stars === value ? null : value)}
                className="px-1 text-2xl leading-none text-clay"
              >
                {filled ? "★" : "☆"}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="mt-4 block">
        <span className="text-xs font-semibold tracking-[0.16em] text-mute uppercase">
          Review
        </span>
        <textarea
          required
          rows={4}
          maxLength={2000}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="mt-1.5 w-full rounded-2xl border border-line bg-cream/50 px-3 py-2 text-base text-ink outline-none focus:border-clay"
        />
      </label>

      <div className="mt-4 flex items-center gap-4">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-paper hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Please wait…" : mine ? "Update review" : "Post review"}
        </button>
        {mine ? (
          <button
            type="button"
            disabled={submitting}
            onClick={() => void onRemove()}
            className="text-sm font-semibold text-mute hover:text-clay-dark disabled:opacity-50"
          >
            Remove
          </button>
        ) : null}
      </div>

      {message ? <FormMessage>{message}</FormMessage> : null}
    </form>
  );
}
