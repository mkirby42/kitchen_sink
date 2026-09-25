"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReviewViewer } from "@/lib/reviews/viewer";
import type { ProfileReview } from "@/lib/therapists/load";
import { createClient } from "@/lib/supabase/client";
import { REVIEW_QUESTIONS, type ReviewRatingKey, type ReviewRatings } from "@/lib/reviews/questions";
import { deleteOwnReview, submitReview } from "@/lib/reviews/submit";
import { validateReview } from "@/lib/reviews/validate";
import { PhiNotice, ReviewEditNote, ReviewPendingNote } from "./PhiNotice";
import { FormMessage, ReviewAuth } from "./ReviewAuth";

export function ReviewComposer({
  therapistId,
  therapistName,
  viewer,
  mine,
}: {
  therapistId: string;
  therapistName: string;
  viewer: ReviewViewer;
  mine: ProfileReview | null;
}) {
  return (
    <section>
      <SessionHeading name={therapistName} />
      {viewer.userId ? (
        <ReviewForm therapistId={therapistId} mine={mine} />
      ) : (
        <div className="mt-5 space-y-4">
          <PhiNotice />
          <ReviewAuth />
        </div>
      )}
    </section>
  );
}

export function SessionHeading({ name }: { name: string }) {
  return (
    <div>
      <h2 className="font-display text-[1.7rem] leading-tight tracking-tight text-ink">
        <span aria-hidden className="text-clay">
          ~{" "}
        </span>
        How was your session with <em className="text-clay">{name}</em>?
      </h2>
      <p className="mt-2 text-sm text-mute">
        Your feedback helps other clients find the right fit.
      </p>
    </div>
  );
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
  const [ratings, setRatings] = useState<ReviewRatings>({
    understood: mine?.understood ?? null,
    communication: mine?.communication ?? null,
    fit: mine?.fit ?? null,
  });
  const [body, setBody] = useState(mine?.body ?? "");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function setRating(key: ReviewRatingKey, value: number) {
    setRatings((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const draft = { authorName, anonymous, ratings, body };
    const parsed = validateReview(draft);
    if (!parsed.ok) {
      setMessage(parsed.error);
      return;
    }
    setSubmitting(true);
    try {
      const supabase = createClient();
      await submitReview(supabase, therapistId, draft);
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
    <form
      onSubmit={onSubmit}
      className="mt-5 space-y-4 rounded-[1.75rem] bg-paper px-5 py-5 shadow-sm"
    >
      <PhiNotice />
      {mine?.status === "pending" ? <ReviewPendingNote /> : null}
      {mine?.status === "approved" ? <ReviewEditNote /> : null}
      <div className="divide-y divide-line">
        {REVIEW_QUESTIONS.map((question) => (
          <StarPicker
            key={question.key}
            label={question.question}
            value={ratings[question.key]}
            onChange={(value) => setRating(question.key, value)}
          />
        ))}
      </div>

      <label className="mt-4 block">
        <span className="text-[15px] font-medium text-ink">
          Anything else you&apos;d like to share?
        </span>
        <textarea
          rows={4}
          maxLength={2000}
          value={body}
          placeholder="Optional — share as much or as little as you'd like."
          onChange={(event) => setBody(event.target.value)}
          className="mt-3 w-full resize-y rounded-2xl border border-line bg-paper px-4 py-3 text-sm leading-relaxed text-ink outline-none placeholder:text-mute/70 focus:border-clay"
        />
      </label>

      <div className="mt-4 border-t border-line pt-4">
        <label className="block">
          <span className="text-sm text-ink">Display name</span>
          <input
            type="text"
            value={authorName}
            maxLength={80}
            disabled={anonymous}
            autoComplete="nickname"
            onChange={(event) => setAuthorName(event.target.value)}
            className="mt-1 w-full border-0 border-b border-line bg-transparent px-0 py-2 text-base outline-none focus:border-clay disabled:opacity-40"
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
      </div>

      <div className="mt-5 flex items-center gap-4">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-clay px-6 py-3 text-sm font-semibold text-paper hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Please wait…" : "Submit for review"}
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

function StarPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
}) {
  return (
    <fieldset className="py-4 first:pt-1">
      <legend className="text-[15px] font-medium text-ink">{label}</legend>
      <div className="mt-2 flex gap-1.5" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = value != null && n <= value;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              onClick={() => onChange(n)}
              className={`text-[1.65rem] leading-none ${filled ? "text-clay" : "text-clay/30"}`}
            >
              ★
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
