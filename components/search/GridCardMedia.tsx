"use client";

import { useState } from "react";
import { FindCardLink } from "@/components/analytics/FindCardLink";
import { FrameVideo } from "@/components/ui/FrameVideo";
import { NoJsVideo } from "@/components/ui/NoJsMedia";
import { VideoStill } from "@/components/ui/VideoStill";
import { PersonMark } from "@/components/search/find-marks";

export function GridCardMedia({
  name,
  photoUrl,
  videoUrl,
  formatBadge,
  href,
  therapistId,
}: {
  name: string;
  photoUrl: string | null;
  videoUrl: string | null;
  formatBadge: string | null;
  href: string;
  therapistId: string;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative aspect-[4/5] overflow-hidden bg-[#E4DCCE]">
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
      ) : (
        <PersonMark />
      )}
      {playing && videoUrl ? (
        <FrameVideo src={videoUrl} label={`Intro video for ${name}`} fit="contain" />
      ) : (
        <>
          <FindCardLink
            href={href}
            therapistId={therapistId}
            aria-label={`See ${name}'s profile`}
            className="absolute inset-0 z-10"
          />
          {videoUrl ? (
            <button
              type="button"
              aria-label={`Play intro video for ${name}`}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setPlaying(true);
              }}
              className="absolute right-3 bottom-3 z-20 flex size-9 items-center justify-center rounded-full bg-paper text-ink shadow-[0_8px_20px_rgb(23_23_23/0.18)]"
            >
              <svg viewBox="0 0 24 24" className="ml-0.5 h-3.5 w-3.5 fill-current" aria-hidden>
                <path d="M9 7.2v9.6l8.2-4.8L9 7.2z" />
              </svg>
            </button>
          ) : null}
        </>
      )}
      {videoUrl ? (
        <NoJsVideo
          src={videoUrl}
          poster={photoUrl}
          label={`Intro video for ${name}`}
        />
      ) : null}
      {formatBadge && !playing ? (
        <p className="absolute top-3 left-3 z-20 rounded-full bg-paper px-2.5 py-1 font-sans text-[12px] leading-4 font-medium text-ink shadow-[0_6px_16px_rgb(23_23_23/0.12)]">
          {formatBadge}
        </p>
      ) : null}
    </div>
  );
}
