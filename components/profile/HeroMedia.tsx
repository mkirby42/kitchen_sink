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
    <div className="relative isolate overflow-hidden rounded-[2rem] bg-ink text-paper shadow-sm">
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

        {!showVideo ? (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/90 from-5% via-ink/35 via-40% to-transparent" />
        ) : null}

        {videoUrl && !showVideo ? (
          <>
            <p className="absolute top-4 left-4 flex items-center rounded-full bg-paper/95 px-3 py-1 text-xs font-medium text-ink shadow-sm">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-clay" />
              1 min intro
            </p>
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="absolute top-[42%] left-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-paper shadow-[0_8px_28px_rgba(27,39,68,0.28)]"
              aria-label={`Play intro video for ${name}`}
            >
              <svg
                viewBox="0 0 24 24"
                className="ml-1 h-6 w-6 fill-clay"
                aria-hidden
              >
                <path d="M8 5.5v13l11-6.5-11-6.5z" />
              </svg>
            </button>
          </>
        ) : null}

        {showVideo ? <h1 className="sr-only">{name}</h1> : (
          <div className="absolute inset-x-0 bottom-0 p-6">
            <h1 className="font-display text-4xl leading-tight tracking-tight text-paper">
              {name}{" "}
              {credential ? (
                <span className="font-sans text-xl font-normal tracking-wide text-paper/85">
                  {credential}
                </span>
              ) : null}
            </h1>
            {meta ? (
              <p className="mt-1 text-sm text-paper/80">{meta}</p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {formatLabel ? (
                <span className="rounded-full bg-paper/20 px-3 py-1.5 text-sm text-paper backdrop-blur-sm">
                  ↑ {formatLabel}
                </span>
              ) : null}
              {modalities.length > 0 ? (
                <span className="rounded-full bg-paper/20 px-3 py-1.5 text-sm text-paper backdrop-blur-sm">
                  ♡ {modalities.join(" · ")}
                </span>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
