"use client";

/**
 * One frame from an intro video, used when a profile has a video and no photo.
 * A media-fragment seek paints that frame. Playback still starts from the
 * play control on a separate element. A photo poster does not use this.
 */
export function videoStillSrc(url: string) {
  if (/#t=\d/.test(url)) return url;
  return `${url}#t=0.1`;
}

function seekStill(node: HTMLVideoElement | null) {
  if (!node) return;
  const seek = () => {
    if (node.currentTime < 0.05) node.currentTime = 0.1;
  };
  if (node.readyState >= 2) seek();
  else node.addEventListener("loadeddata", seek, { once: true });
}

const stillClass =
  "pointer-events-none absolute inset-0 h-full w-full bg-black object-cover object-[center_18%] [&::-webkit-media-controls]:hidden [&::-webkit-media-controls-overlay-play-button]:hidden [&::-webkit-media-controls-start-playback-button]:hidden";

export function VideoStill({ src }: { src: string }) {
  return (
    <video
      ref={seekStill}
      data-video-still
      className={stillClass}
      src={videoStillSrc(src)}
      preload="metadata"
      muted
      playsInline
      disablePictureInPicture
      tabIndex={-1}
      aria-hidden
    />
  );
}
