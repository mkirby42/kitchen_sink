"use client";

import { useState } from "react";

type CardIntroVideoProps = {
  name: string;
  initials: string;
  photoUrl: string | null;
  videoUrl: string;
};

export function CardIntroVideo({
  name,
  initials,
  photoUrl,
  videoUrl,
}: CardIntroVideoProps) {
  const [playing, setPlaying] = useState(false);
  // 9:16 column. object-contain keeps a portrait clip whole; landscape letterboxes.
  // Explicit width so a row layout cannot stretch the frame and crop it.
  const frame =
    "relative aspect-[9/16] w-40 shrink-0 self-start overflow-hidden rounded-box bg-ink sm:w-52";
  const media = "absolute inset-0 h-full w-full object-contain";

  if (playing) {
    return (
      <div className={frame}>
        <video
          className={media}
          src={videoUrl}
          poster={photoUrl ?? undefined}
          preload="none"
          controls
          playsInline
          autoPlay
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setPlaying(true);
      }}
      aria-label={`Play intro video for ${name}`}
      className={`${frame} group block text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink`}
    >
      {photoUrl ? (
        // Public Storage URLs; next/image is out of scope this weekend.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" className={media} />
      ) : (
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center font-display text-5xl text-paper/80"
        >
          {initials}
        </span>
      )}
      <span
        className="pointer-events-none absolute top-1/2 left-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-paper/80 bg-transparent group-hover:bg-paper/15"
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          className="ml-1 h-7 w-7 fill-paper drop-shadow-[0_1px_2px_rgba(27,39,68,0.7)]"
        >
          <path d="M8 5.5v13l11-6.5-11-6.5z" />
        </svg>
      </span>
    </button>
  );
}
