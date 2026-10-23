"use client";

import { useState } from "react";
import { FindCardLink } from "@/components/analytics/FindCardLink";
import { HiddenFromPublicBadge } from "@/components/directory/HiddenFromPublicBadge";
import { FrameVideo } from "@/components/ui/FrameVideo";
import { VideoStill } from "@/components/ui/VideoStill";
import { buildTherapistHref } from "@/components/search/query";
import { desktopFormatBadge } from "@/lib/search/find-desktop";
import { phoneListQuote, type StackCard } from "@/lib/search/phone-find";
import type { SearchFilters, SearchRow } from "@/lib/search/rpc";
import { DRAFT_PROFILE_LABEL } from "@/lib/therapists/listing";
import { credentialTitle, givenName } from "@/lib/therapists/display";
import { MAYA_ID } from "@/lib/therapists/ids";

/**
 * Phone List card when a photo or intro video is saved.
 * 4:5 frame, cover crop, play stays in the frame. The rest of the card opens the profile.
 */
export function PhoneListPortrait({
  row,
  filters,
  cards,
  photoUrl,
  videoUrl,
}: {
  row: SearchRow;
  filters: SearchFilters;
  cards?: readonly StackCard[];
  photoUrl: string | null;
  videoUrl: string | null;
}) {
  const [playing, setPlaying] = useState(false);
  const quote = phoneListQuote(row, cards);
  const format = desktopFormatBadge(row.virtual_practice, row.in_person_practice);
  const credential = credentialTitle(row.credential);
  const href = buildTherapistHref(row.profile_id, filters);
  const given = givenName(row.name);
  const draft = row.published === false;
  const hidden = row.listed === false;
  // The frame link unmounts while the video plays, so the profile stays reachable below it.
  const showBelow = Boolean(quote) || draft || hidden || playing;

  return (
    <div data-find-card="phone" data-phone-list-media="" className="md:hidden">
      <div className="relative aspect-[4/5] overflow-hidden bg-black">
        {photoUrl ? (
          // Public Storage URLs; next/image is out of scope.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[center_18%]"
          />
        ) : videoUrl ? (
          <VideoStill src={videoUrl} />
        ) : null}
        {playing && videoUrl ? (
          <FrameVideo src={videoUrl} label={`Intro video for ${row.name}`} />
        ) : (
          <>
            <FindCardLink
              href={href}
              therapistId={row.profile_id}
              aria-label={`Get to know ${given}`}
              className="absolute inset-0 z-10 flex flex-col justify-end"
            >
              <span className="bg-gradient-to-t from-black/80 via-black/40 via-[40%] to-transparent px-4 pt-16 pb-4">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-[28px] leading-8 font-medium text-white drop-shadow-[0_1px_8px_rgba(23,23,23,0.55)]">
                    {row.name}
                  </span>
                  {row.profile_id === MAYA_ID ? (
                    <span className="shrink-0 rounded-full bg-gold px-2 py-0.5 text-[11px] font-medium tracking-wide text-black">
                      SAMPLE
                    </span>
                  ) : null}
                </span>
                {credential ? (
                  <span className="mt-1 block font-sans text-[14px] leading-5 font-normal text-white/90 drop-shadow-[0_1px_6px_rgba(23,23,23,0.65)]">
                    {credential}
                  </span>
                ) : null}
              </span>
            </FindCardLink>
            {videoUrl ? (
              <button
                type="button"
                aria-label={`Play intro video for ${row.name}`}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setPlaying(true);
                }}
                className="absolute top-1/2 left-1/2 z-20 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-paper/80 bg-transparent text-paper hover:bg-paper/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="ml-1 size-7 fill-paper drop-shadow-[0_1px_2px_rgba(27,39,68,0.7)]"
                  aria-hidden
                >
                  <path d="M8 5.5v13l11-6.5-11-6.5z" />
                </svg>
              </button>
            ) : null}
            {format ? (
              <span
                data-find-formats
                className="pointer-events-none absolute top-3 left-3 z-20 rounded-full bg-paper px-2.5 py-1 font-sans text-[12px] leading-4 font-medium text-ink shadow-[0_6px_16px_rgb(23_23_23/0.12)]"
              >
                {format}
              </span>
            ) : null}
          </>
        )}
      </div>
      {showBelow ? (
        <FindCardLink
          href={href}
          therapistId={row.profile_id}
          className="block px-4 pt-4 pb-5"
        >
          {quote ? (
            <>
              <span className="block font-sans text-[14px] leading-5 font-medium text-meta">
                {quote.label}
              </span>
              <span className="mt-1.5 line-clamp-4 font-display text-[20px] leading-[30px] font-normal text-copy">
                {quote.answer}
              </span>
            </>
          ) : playing ? (
            <span className="font-sans text-[17px] leading-6 font-medium text-copy">
              {row.name}
            </span>
          ) : null}
          {draft ? (
            <HiddenFromPublicBadge variant="card" label={DRAFT_PROFILE_LABEL} />
          ) : null}
          {hidden ? <HiddenFromPublicBadge variant="card" /> : null}
        </FindCardLink>
      ) : null}
    </div>
  );
}
