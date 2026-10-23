"use client";

import { useEffect, useState } from "react";

const fitClass = {
  /** Phone and the desktop Find detail. Crops a 9:16 intro to the frame. */
  cover: "object-cover object-[center_18%]",
  /** Whole clip, letterboxed. Used where playback should not crop. */
  contain: "object-contain",
} as const;

/**
 * Intro playback inside an already-sized frame.
 * No `poster` attribute: Firefox does not apply object-fit to a video poster,
 * so the still is the img or frame underneath until the first decoded frame.
 */
export function FrameVideo({
  src,
  label,
  fit = "cover",
}: {
  src: string;
  label?: string;
  fit?: keyof typeof fitClass;
}) {
  const [ready, setReady] = useState(false);
  const [node, setNode] = useState<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (node && node.readyState >= 2) setReady(true);
  }, [node]);

  return (
    <video
      data-frame-video={ready ? "ready" : "loading"}
      className={`absolute inset-0 h-full w-full min-h-0 min-w-0 bg-black ${fitClass[fit]} ${ready ? "" : "opacity-0"}`}
      src={src}
      preload="auto"
      controls
      playsInline
      autoPlay
      aria-label={label}
      ref={setNode}
      onLoadedData={() => setReady(true)}
    />
  );
}
