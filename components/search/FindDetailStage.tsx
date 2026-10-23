"use client";

import { useState } from "react";
import { FrameVideo } from "@/components/ui/FrameVideo";
import { VideoStill } from "@/components/ui/VideoStill";
import { PersonMark } from "@/components/search/find-marks";

const stillClass =
  "absolute inset-0 h-full w-full object-cover object-[center_18%]";

export function FindDetailStage({
  name,
  photoUrl,
  videoUrl,
}: {
  name: string;
  photoUrl: string | null;
  videoUrl: string | null;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <div
      data-find-stage
      className="relative mx-auto aspect-[4/5] w-full max-w-[26.5rem] overflow-hidden rounded-[28px] bg-[#E4DCCE]"
    >
      {photoUrl ? (
        // Public Storage URLs; next/image is out of scope.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" className={stillClass} />
      ) : videoUrl ? (
        <VideoStill src={videoUrl} />
      ) : (
        <PersonMark />
      )}
      {playing && videoUrl ? (
        <FrameVideo src={videoUrl} label={`Intro video for ${name}`} />
      ) : videoUrl ? (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Watch intro for ${name}`}
          className="absolute bottom-4 left-4 z-10 inline-flex items-center gap-2.5 rounded-full bg-paper py-1.5 pr-4 pl-1.5 font-sans text-sm font-medium text-ink shadow-[0_10px_28px_rgb(23_23_23/0.18)]"
        >
          <span
            className="flex size-8 items-center justify-center rounded-full bg-ink"
            aria-hidden
          >
            <svg viewBox="0 0 24 24" className="ml-0.5 h-3.5 w-3.5 fill-paper">
              <path d="M9 7.2v9.6l8.2-4.8L9 7.2z" />
            </svg>
          </span>
          Watch intro
        </button>
      ) : null}
    </div>
  );
}
