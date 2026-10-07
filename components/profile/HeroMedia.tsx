"use client";

import { useState } from "react";

type HeroMediaProps = {
  name: string;
  initials: string;
  photoUrl: string | null;
  videoUrl: string | null;
  credential: string | null;
  licenseText: string | null;
  years: number | null;
  formatLabel: string | null;
  modalities: string[];
};

export function HeroMedia({
  name,
  initials,
  photoUrl,
  videoUrl,
  credential,
  licenseText,
  years,
  formatLabel,
  modalities,
}: HeroMediaProps) {
  const [playing, setPlaying] = useState(false);
  const showVideo = Boolean(videoUrl && playing);

  const yearsLabel =
    years == null ? null : `${years} yr${years === 1 ? "" : "s"} practicing`;
  const meta = [licenseText, yearsLabel].filter(Boolean).join(" · ");

  return (
    <div>
      <div className="relative isolate overflow-hidden rounded-[2rem] bg-ink shadow-sm">
        <div className="relative aspect-[3/4] min-h-[28rem] w-full">
          {showVideo && videoUrl ? (
            <video
              className="absolute inset-0 h-full w-full object-cover object-[center_18%]"
              src={videoUrl}
              poster={photoUrl ?? undefined}
              controls
              autoPlay
              playsInline
            />
          ) : photoUrl ? (
            // Public Storage URLs; next/image is out of scope this weekend.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={name}
              className="absolute inset-0 h-full w-full object-cover object-[center_18%]"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center bg-ink"
              aria-hidden
            >
              <span className="font-display text-7xl tracking-wide text-paper/80">
                {initials}
              </span>
            </div>
          )}

          {videoUrl && !showVideo ? (
            <>
              <p className="absolute top-4 left-4 flex items-center rounded-full bg-paper/95 px-3 py-1 text-xs font-medium text-ink shadow-sm">
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-clay" />
                1 min intro
              </p>
              <button
                type="button"
                onClick={() => setPlaying(true)}
                className="absolute top-1/2 left-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-paper/80 bg-transparent hover:bg-paper/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
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
            </>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <h1 className="font-display text-4xl leading-tight tracking-tight text-ink">
          {name}{" "}
          {credential ? (
            <span className="font-sans text-xl font-normal tracking-wide text-mute">
              {credential}
            </span>
          ) : null}
        </h1>
        {meta ? <p className="mt-1 text-sm text-mute">{meta}</p> : null}
        {formatLabel || modalities.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {formatLabel ? (
              <span className="rounded-full bg-paper px-3 py-1.5 text-sm text-ink shadow-sm">
                ↑ {formatLabel}
              </span>
            ) : null}
            {modalities.length > 0 ? (
              <span className="rounded-full bg-paper px-3 py-1.5 text-sm text-ink shadow-sm">
                ♡ {modalities.join(" · ")}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
