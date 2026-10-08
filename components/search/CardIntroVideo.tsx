"use client";

import { useRef, useState } from "react";
import { flushSync } from "react-dom";

type CardIntroVideoProps = {
  name: string;
  /** First name for the desktop “Watch {name}'s intro” pill. */
  given?: string;
  initials: string;
  photoUrl: string | null;
  videoUrl: string;
  /** `frame` is the phone 9:16 control. `portrait` fills the desktop card column. */
  variant?: "frame" | "portrait";
};

export function CardIntroVideo({
  name,
  given,
  initials,
  photoUrl,
  videoUrl,
  variant = "frame",
}: CardIntroVideoProps) {
  if (variant === "portrait") {
    return (
      <PortraitIntro
        given={given?.trim() || name}
        initials={initials}
        photoUrl={photoUrl}
        videoUrl={videoUrl}
      />
    );
  }

  return (
    <FrameIntro
      name={name}
      initials={initials}
      photoUrl={photoUrl}
      videoUrl={videoUrl}
    />
  );
}

function FrameIntro({
  name,
  initials,
  photoUrl,
  videoUrl,
}: {
  name: string;
  initials: string;
  photoUrl: string | null;
  videoUrl: string;
}) {
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

function PortraitIntro({
  given,
  initials,
  photoUrl,
  videoUrl,
}: {
  given: string;
  initials: string;
  photoUrl: string | null;
  videoUrl: string;
}) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const watchLabel = `Watch ${given}'s intro`;

  if (playing) {
    return (
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full bg-ink object-contain"
        src={videoUrl}
        poster={photoUrl ?? undefined}
        preload="none"
        controls
        playsInline
        autoPlay
      />
    );
  }

  return (
    <>
      {photoUrl ? (
        // Public Storage URLs; next/image is out of scope this weekend.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[center_18%]"
        />
      ) : (
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center font-display text-6xl text-paper/80"
        >
          {initials}
        </span>
      )}
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          flushSync(() => setPlaying(true));
          void videoRef.current?.play();
        }}
        aria-label={watchLabel}
        className="absolute bottom-4 left-4 z-10 inline-flex items-center gap-2.5 rounded-full bg-paper py-1.5 pr-4 pl-1.5 text-sm font-medium text-ink shadow-[0_10px_28px_rgb(27_39_68/0.2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
      >
        <span
          className="flex size-8 items-center justify-center rounded-full bg-clay"
          aria-hidden
        >
          <svg viewBox="0 0 24 24" className="ml-0.5 h-3.5 w-3.5 fill-paper">
            <path d="M9 7.2v9.6l8.2-4.8L9 7.2z" />
          </svg>
        </span>
        {watchLabel}
      </button>
    </>
  );
}
