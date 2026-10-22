"use client";

import { Children, useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { ContactCtas } from "@/components/profile/ContactCtas";
import { useHorizontalSnap } from "@/components/search/useHorizontalSnap";
import { useSwipeHint } from "@/components/search/useSwipeHint";
import { VideoStill } from "@/components/ui/VideoStill";
import { SWIPE_HINT, swipeForLabel } from "@/lib/search/phone-find";
import { phoneBrowseRootClass } from "@/lib/search/phone-browse";
import type { PhoneStackBooking } from "@/lib/search/phone-stack";
import type { SearchRow } from "@/lib/search/rpc";
import { initials, storagePublicUrl } from "@/lib/therapists/display";
import { browseStep } from "@/lib/search/phone-browse";

function onBrowseKeyDown(
  event: KeyboardEvent<HTMLDivElement>,
  onBrowseKey: (key: "ArrowLeft" | "ArrowRight") => void,
) {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (!target.closest("[data-browse-control]")) return;
  event.preventDefault();
  onBrowseKey(event.key);
}

const stackScrollerClass =
  "grid min-w-0 snap-x snap-mandatory grid-flow-col items-start gap-3 overflow-x-auto overflow-y-clip scroll-smooth overscroll-x-contain [touch-action:pan-x_pan-y] motion-reduce:scroll-auto [scrollbar-width:none]";

function hasBooking(booking: PhoneStackBooking | undefined) {
  return Boolean(booking && booking.actions.length > 0 && booking.contact.length > 0);
}

export function PhoneProfileStack({
  rows,
  booking,
  onBack,
  children,
}: {
  rows: SearchRow[];
  /** Parallel to `rows`. The active entry is the pinned dock. */
  booking: PhoneStackBooking[];
  onBack: () => void;
  /** One phone profile column per row, same order as `rows`. */
  children: ReactNode;
}) {
  const count = rows.length;
  const slides = Children.toArray(children);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const snap = useHorizontalSnap(count, scrollerRef, slideRefs);
  const many = count > 1;
  const { show: showHint, dismiss } = useSwipeHint(many);
  const active = rows[snap.index];
  const activeBooking = booking[snap.index] ?? null;

  useEffect(() => {
    if (snap.index > 0) dismiss();
  }, [snap.index, dismiss]);

  return (
    <div
      data-phone-stack=""
      className={phoneBrowseRootClass}
      onKeyDown={(event) => onBrowseKeyDown(event, snap.onBrowseKey)}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 font-sans text-[15px] font-medium text-heading"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
            <path d="M15 5 8 12l7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          All {count}
        </button>
        {many ? (
          <p className="font-sans text-sm text-mute" aria-live="polite">
            <span className="sr-only">{active?.name}. </span>
            {snap.index + 1} of {count}
          </p>
        ) : null}
      </div>
      {many ? (
        <div data-phone-progress="" className="mb-4 flex gap-1" aria-hidden>
          {rows.map((row, dot) => (
            <span
              key={row.profile_id}
              className={
                dot <= snap.index
                  ? "h-1 flex-1 rounded-full bg-heading"
                  : "h-1 flex-1 rounded-full bg-heading/20"
              }
            />
          ))}
        </div>
      ) : null}
      {many && showHint ? (
        <p className="mb-3 text-center font-sans text-[13px] font-medium text-meta">
          {SWIPE_HINT}
        </p>
      ) : null}
      {many ? (
        <div className="sr-only">
          <button
            type="button"
            data-browse-control="prev"
            aria-label="Previous therapist"
            disabled={snap.index === 0}
            onClick={() => snap.goTo(browseStep(snap.index, count, -1))}
          >
            Previous therapist
          </button>
          <button
            type="button"
            data-browse-control="next"
            aria-label="Next therapist"
            disabled={snap.index >= count - 1}
            onClick={() => snap.goTo(browseStep(snap.index, count, 1))}
          >
            Next therapist
          </button>
        </div>
      ) : null}
      <div
        ref={scrollerRef}
        data-phone-scroller=""
        role="region"
        aria-roledescription="carousel"
        aria-label="Therapists"
        onPointerDown={() => snap.release()}
        className={
          many
            ? `${stackScrollerClass} auto-cols-[86%]`
            : `${stackScrollerClass} auto-cols-[100%]`
        }
      >
        {rows.map((row, position) => {
          const next = rows[position + 1];
          return (
            <div
              key={row.profile_id}
              ref={(node) => {
                slideRefs.current[position] = node;
              }}
              data-phone-slide={position === snap.index ? "active" : "inactive"}
              className={`min-w-0 snap-start [scroll-snap-stop:always] ${
                hasBooking(booking[position])
                  ? "pb-[calc(6.5rem+env(safe-area-inset-bottom))]"
                  : "pb-4"
              }`}
              aria-hidden={position === snap.index ? undefined : true}
              inert={position === snap.index ? undefined : true}
            >
              {slides[position] ?? (
                <p className="rounded-card bg-paper px-5 py-10 text-center text-mute shadow-card">
                  This profile isn&apos;t available right now.
                </p>
              )}
              {next ? (
                <button
                  type="button"
                  onClick={() => snap.goTo(position + 1)}
                  className="mt-8 flex w-full items-center gap-3 rounded-2xl border border-line bg-paper p-3 text-left"
                >
                  <NextThumb row={next} />
                  <span className="min-w-0">
                    <span className="block font-sans text-[13px] font-medium text-heading">
                      {swipeForLabel(position + 2, count)}
                    </span>
                    <span className="mt-0.5 block truncate font-sans text-[15px] font-medium text-copy">
                      {next.name}
                    </span>
                    {next.card_answer?.trim() ? (
                      <span className="mt-0.5 block truncate text-[13px] text-meta">
                        {next.card_answer.trim()}
                      </span>
                    ) : null}
                  </span>
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
      {hasBooking(activeBooking) && activeBooking ? (
        <ContactCtas
          key={activeBooking.id}
          name={activeBooking.givenName}
          actions={activeBooking.actions}
          contact={activeBooking.contact}
          therapistId={activeBooking.id}
        />
      ) : null}
    </div>
  );
}

function NextThumb({ row }: { row: SearchRow }) {
  const photoUrl = storagePublicUrl("photos", row.photo_key);
  const videoUrl = storagePublicUrl("videos", row.video_key);
  return (
    <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-heading">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : videoUrl ? (
        <VideoStill src={videoUrl} />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-white">
          {initials(row.name)}
        </span>
      )}
    </span>
  );
}
