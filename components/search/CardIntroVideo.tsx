"use client";

import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { VideoStill } from "@/components/ui/VideoStill";

type CardIntroVideoProps = {
  name: string;
  /** First name for the desktop “Watch {name}'s intro” pill. */
  given?: string;
  photoUrl: string | null;
  videoUrl: string;
  /** `frame` is the phone full-bleed portrait. `portrait` fills the desktop card column. */
  variant?: "frame" | "portrait";
};

export function CardIntroVideo({
  name,
  given,
  photoUrl,
  videoUrl,
  variant = "frame",
}: CardIntroVideoProps) {
  if (variant === "portrait") {
    return (
      <PortraitIntro
        given={given?.trim() || name}
        photoUrl={photoUrl}
        videoUrl={videoUrl}
      />
    );
  }

  return <FrameIntro name={name} photoUrl={photoUrl} videoUrl={videoUrl} />;
}

function FrameIntro({
  name,
  photoUrl,
  videoUrl,
}: {
  name: string;
  photoUrl: string | null;
  videoUrl: string;
}) {
  const [playing, setPlaying] = useState(false);
  // Full-bleed phone portrait. Poster crops to the frame; playback stays whole.
  const frame = "relative aspect-[4/5] w-full overflow-hidden bg-black";

  if (playing) {
    return (
      <div className={frame}>
        <video
          className="absolute inset-0 h-full w-full bg-black object-contain"
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
    <div className={frame}>
      {photoUrl ? (
        // Public Storage URLs; next/image is out of scope this weekend.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[center_18%]"
        />
      ) : (
        <VideoStill src={videoUrl} />
      )}
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setPlaying(true);
        }}
        aria-label={`Play intro video for ${name}`}
        className="group absolute inset-0 z-10 block focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset"
      >
        <span
          className="pointer-events-none absolute top-1/2 left-1/2 flex size-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-white bg-white/10 group-hover:bg-white/20"
          aria-hidden
        >
          <svg
            viewBox="0 0 24 24"
            className="ml-1.5 h-10 w-10 fill-white drop-shadow-[0_1px_2px_rgba(27,39,68,0.55)]"
          >
            <path d="M8 5.5v13l11-6.5-11-6.5z" />
          </svg>
        </span>
      </button>
    </div>
  );
}

function PortraitIntro({
  given,
  photoUrl,
  videoUrl,
}: {
  given: string;
  photoUrl: string | null;
  videoUrl: string;
}) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const watchLabel = "Watch intro";

  if (playing) {
    return (
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full bg-black object-contain"
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
        <VideoStill src={videoUrl} />
      )}
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          flushSync(() => setPlaying(true));
          void videoRef.current?.play();
        }}
        aria-label={`Watch intro for ${given}`}
        className="absolute bottom-4 left-4 z-10 inline-flex items-center gap-2.5 rounded-full bg-paper py-1.5 pr-4 pl-1.5 text-sm font-medium text-ink shadow-[0_10px_28px_rgb(23_23_23/0.18)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper"
      >
        <span
          className="flex size-8 items-center justify-center rounded-full bg-ink"
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
