"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ContactSheet } from "@/components/profile/ContactSheet";
import { CardIntroVideo } from "@/components/search/CardIntroVideo";
import { useHorizontalSnap } from "@/components/search/useHorizontalSnap";
import { useSwipeHint } from "@/components/search/useSwipeHint";
import { VideoStill } from "@/components/ui/VideoStill";
import { promptAnswerClass } from "@/components/profile/prompt-type";
import { metaLineClass, primaryPillClass, therapistNameClass } from "@/components/ui/styles";
import { trackCta } from "@/lib/analytics/track";
import { desktopPromptHeading } from "@/lib/search/find-desktop";
import {
  SUPERBILL_NOTE,
  SWIPE_HINT,
  formatFacts,
  licenseFacts,
  phoneBookAction,
  showSuperbill,
  stackCards,
  swipeForLabel,
  takesPlans,
  yearsFact,
} from "@/lib/search/phone-find";
import { phoneBrowseRootClass } from "@/lib/search/phone-browse";
import type { PhoneStackExtra } from "@/lib/search/phone-stack";
import type { SearchFilters, SearchRow } from "@/lib/search/rpc";
import {
  credentialTitle,
  formatUsdFromCents,
  givenName,
  initials,
  storagePublicUrl,
} from "@/lib/therapists/display";
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

export function PhoneProfileStack({
  rows,
  extras,
  filters,
  onBack,
}: {
  rows: SearchRow[];
  extras: PhoneStackExtra[];
  filters: SearchFilters;
  onBack: () => void;
}) {
  const count = rows.length;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const snap = useHorizontalSnap(count, scrollerRef, slideRefs);
  const many = count > 1;
  const { show: showHint, dismiss } = useSwipeHint(many);
  const byId = new Map(extras.map((extra) => [extra.id, extra]));
  const active = rows[snap.index];
  const activeExtra = active ? byId.get(active.profile_id) : undefined;
  const book = phoneBookAction(activeExtra?.contact);
  const activeId = active?.profile_id ?? "";
  const [openId, setOpenId] = useState<string | null>(null);
  const [seenId, setSeenId] = useState(activeId);
  if (activeId !== seenId) {
    setSeenId(activeId);
    setOpenId(null);
  }
  const contactOpen = openId === activeId && activeId !== "";

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
                phoneBookAction(byId.get(row.profile_id)?.contact) ? "pb-28" : "pb-4"
              }`}
              aria-hidden={position === snap.index ? undefined : true}
              inert={position === snap.index ? undefined : true}
            >
              <StackSlide
                row={row}
                extra={byId.get(row.profile_id)}
                filters={filters}
                hint={position === 0 && showHint ? SWIPE_HINT : null}
                next={
                  next
                    ? {
                        label: swipeForLabel(position + 2, count),
                        row: next,
                        onOpen: () => snap.goTo(position + 1),
                      }
                    : null
                }
              />
            </div>
          );
        })}
      </div>
      {book && active ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-cream px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
          <button
            type="button"
            className={`${primaryPillClass} w-full cursor-pointer px-6 py-3.5`}
            aria-haspopup="dialog"
            aria-expanded={contactOpen}
            onClick={() => {
              trackCta(active.profile_id, book.cta);
              setOpenId(active.profile_id);
            }}
          >
            {book.label}
          </button>
        </div>
      ) : null}
      <ContactSheet
        open={contactOpen}
        name={givenName(active?.name ?? "")}
        contact={activeExtra?.contact ?? []}
        onClose={() => setOpenId(null)}
      />
    </div>
  );
}

function StackSlide({
  row,
  extra,
  filters,
  hint,
  next,
}: {
  row: SearchRow;
  extra: PhoneStackExtra | undefined;
  filters: SearchFilters;
  hint: string | null;
  next: { label: string; row: SearchRow; onOpen: () => void } | null;
}) {
  const photoUrl = storagePublicUrl("photos", row.photo_key);
  const videoUrl = storagePublicUrl("videos", row.video_key);
  const portrait = Boolean(photoUrl || videoUrl);
  const cards = stackCards(row, extra?.cards);
  const [first, ...rest] = cards;
  const heading = first ? desktopPromptHeading(first.prompt) : null;
  const credential = credentialTitle(row.credential);
  const facts = [
    ...formatFacts(row.virtual_practice, row.in_person_practice),
    yearsFact(row.start_date_of_practice),
    ...licenseFacts(extra?.licenseStates ?? [], filters.state),
  ].filter((fact): fact is string => Boolean(fact));
  const plans = takesPlans(row.insurance_labels, { ...filters, tags: [] });
  const superbill = showSuperbill(row.insurance_labels, extra?.superbill === true);
  const rates = extra?.rates ?? [];
  const given = givenName(row.name);

  return (
    <article className="overflow-hidden rounded-card bg-paper shadow-card">
      {portrait ? (
        <div className="relative aspect-[4/5] bg-black">
          {videoUrl ? (
            <CardIntroVideo
              variant="portrait"
              name={row.name}
              given={given}
              photoUrl={photoUrl}
              videoUrl={videoUrl}
            />
          ) : photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-[center_18%]"
            />
          ) : null}
          {hint ? (
            <p className="absolute top-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-ink/80 px-3 py-1.5 text-center font-sans text-[13px] font-medium whitespace-nowrap text-paper">
              {hint}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="px-5 py-5">
        <h2 className={therapistNameClass}>{row.name}</h2>
        {credential ? <p className={`mt-1 ${metaLineClass}`}>{credential}</p> : null}
        {first && heading ? (
          <div className="mt-5 rounded-[20px] bg-pill-bg px-4 py-4">
            <p className="font-sans text-[11px] leading-4 font-medium tracking-[0.16em] text-prompt">
              {heading}
            </p>
            <p className={promptAnswerClass}>{first.answer}</p>
          </div>
        ) : null}
        {facts.length > 0 ? (
          <ul className="mt-5 flex flex-wrap gap-2">
            {facts.map((fact) => (
              <li
                key={fact}
                className="rounded-full border border-line px-3 py-1 font-sans text-[13px] font-medium text-ink"
              >
                {fact}
              </li>
            ))}
          </ul>
        ) : null}
        {plans.length > 0 ? (
          <p className={`mt-4 ${metaLineClass}`}>{plans.join(", ")}</p>
        ) : null}
        {superbill ? <p className={`mt-2 ${metaLineClass}`}>{SUPERBILL_NOTE}</p> : null}
        {rest.map((card) => (
          <div key={card.prompt} className="mt-5">
            <p className="font-sans text-[15px] leading-5 font-medium text-prompt">
              {card.prompt}
            </p>
            <p className={promptAnswerClass}>{card.answer}</p>
          </div>
        ))}
        {rates.length > 0 || row.sliding_scale ? (
          <div className="mt-5">
            <h3 className="font-sans text-[14px] font-medium tracking-[0.04em] text-meta">
              Fees
            </h3>
            <dl className="mt-2">
              {rates.map((rate) => (
                <div
                  key={`${rate.service_type}-${rate.duration_minutes}`}
                  className="flex items-baseline justify-between gap-4 py-1.5"
                >
                  <dt className={metaLineClass}>
                    {rate.service_type} session ({rate.duration_minutes} min)
                  </dt>
                  <dd className="shrink-0 font-sans text-[15px] font-medium text-copy">
                    {formatUsdFromCents(rate.price_cents)}
                  </dd>
                </div>
              ))}
              {row.sliding_scale ? (
                <div className="flex items-baseline justify-between gap-4 py-1.5">
                  <dt className={metaLineClass}>Sliding scale</dt>
                  <dd className="font-sans text-[15px] font-medium text-copy">Available</dd>
                </div>
              ) : null}
            </dl>
          </div>
        ) : null}
        {next ? (
          <button
            type="button"
            onClick={next.onOpen}
            className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-line p-3 text-left"
          >
            <NextThumb row={next.row} />
            <span className="min-w-0">
              <span className="block font-sans text-[13px] font-medium text-heading">
                {next.label}
              </span>
              <span className="mt-0.5 block truncate font-sans text-[15px] font-medium text-copy">
                {next.row.name}
              </span>
              {next.row.card_answer?.trim() ? (
                <span className="mt-0.5 block truncate text-[13px] text-meta">
                  {next.row.card_answer.trim()}
                </span>
              ) : null}
            </span>
          </button>
        ) : null}
      </div>
    </article>
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
