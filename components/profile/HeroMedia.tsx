"use client";

import { useState } from "react";
import { FrameVideo } from "@/components/ui/FrameVideo";
import { NoJsVideo } from "@/components/ui/NoJsMedia";
import { metaLineClass, therapistNameClass, therapistNameOnPhotoClass } from "@/components/ui/styles";
import { VideoStill } from "@/components/ui/VideoStill";

type HeroMediaProps = {
  name: string;
  initials: string;
  videoUrl: string | null;
  /** A saved photo is shown later on the page, so the hero does not paint it or request the video file until play. */
  hasPhoto?: boolean;
  /** Poster for the no-JS video. The scripted hero still does not paint this photo. */
  posterUrl?: string | null;
  licenseCaptions: string[];
  years: number | null;
  /** overlay: phone lead card. poster: desktop frame, name lives in the card below. */
  variant?: "overlay" | "poster";
  watchLabel?: string | null;
};

export function HeroMedia({
  name,
  initials,
  videoUrl,
  hasPhoto = false,
  posterUrl = null,
  licenseCaptions,
  years,
  variant = "overlay",
  watchLabel = null,
}: HeroMediaProps) {
  const [playing, setPlaying] = useState(false);
  const showVideo = Boolean(videoUrl && playing);
  const poster = variant === "poster";

  const yearsLabel =
    years == null ? null : `${years} yr${years === 1 ? "" : "s"} practicing`;
  const showDetails = !poster && (showVideo || Boolean(yearsLabel));

  return (
    <div>
      <div
        data-hero-media
        data-hero-variant={variant}
        className={
          poster
            ? "relative isolate overflow-hidden rounded-[1.75rem] bg-black shadow-card"
            : "relative isolate overflow-hidden rounded-[2rem] bg-black shadow-sm"
        }
      >
        <div
          className={
            poster
              ? "relative aspect-[4/5] w-full"
              : "relative aspect-[3/4] min-h-[28rem] w-full"
          }
        >
          {videoUrl && !hasPhoto ? (
            <VideoStill src={videoUrl} />
          ) : videoUrl ? null : (
            <div
              className="absolute inset-0 flex items-center justify-center bg-black"
              aria-hidden
            >
              <span className="font-sans text-7xl font-medium tracking-wide text-paper/80">
                {initials}
              </span>
            </div>
          )}

          {showVideo && videoUrl ? (
            <FrameVideo src={videoUrl} label={`Intro video for ${name}`} />
          ) : null}

          {videoUrl && !showVideo ? (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="absolute top-1/2 left-1/2 z-10 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-paper/80 bg-transparent hover:bg-paper/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
              aria-label={`Play intro video for ${name}`}
            >
              <svg
                viewBox="0 0 24 24"
                className="ml-1 h-7 w-7 fill-paper drop-shadow-[0_1px_2px_rgba(27,39,68,0.7)]"
                aria-hidden
              >
                <path d="M8 5.5v13l11-6.5-11-6.5z" />
              </svg>
            </button>
          ) : null}

          {videoUrl ? (
            <NoJsVideo
              src={videoUrl}
              poster={posterUrl}
              label={`Intro video for ${name}`}
            />
          ) : null}

          {poster && watchLabel && videoUrl && !showVideo ? (
            <button
              type="button"
              data-watch-intro
              onClick={() => setPlaying(true)}
              className="absolute bottom-3 left-3 z-10 rounded-full bg-ink/75 px-3 py-1.5 text-xs font-medium text-paper"
            >
              {watchLabel}
            </button>
          ) : null}

          {poster || showVideo ? null : (
            <>
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/75 via-black/40 via-[35%] to-transparent"
                aria-hidden
              />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h1 className={therapistNameOnPhotoClass}>
                  {name}
                </h1>
                {licenseCaptions.length > 0 ? (
                  <div className="mt-1.5 space-y-0.5">
                    {licenseCaptions.map((line) => (
                      <p
                        key={line}
                        className="font-sans text-[15px] leading-[22px] font-normal text-paper/95 drop-shadow-[0_1px_6px_rgba(23,23,23,0.7)]"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>

      {showDetails ? (
        <div data-hero-details className="mt-4">
          {showVideo ? (
            <>
              <h1 className={therapistNameClass}>
                {name}
              </h1>
              {licenseCaptions.length > 0 ? (
                <div className="mt-1 space-y-0.5">
                  {licenseCaptions.map((line) => (
                    <p key={line} className={metaLineClass}>
                      {line}
                    </p>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
          {yearsLabel ? (
            <p className={showVideo ? `mt-1 ${metaLineClass}` : metaLineClass}>
              {yearsLabel}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
