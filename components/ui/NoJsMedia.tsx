/**
 * Native playback for browsers that never run our scripts.
 * `preload="none"` keeps the file off the network until the person hits play.
 * The scripted player stays the one on screen once `html` has class `js`.
 */
export function NoJsVideo({
  src,
  poster,
  label,
}: {
  src: string;
  poster?: string | null;
  label: string;
}) {
  return (
    <video
      data-no-js=""
      className="absolute inset-0 z-30 h-full w-full bg-black object-cover object-[center_18%]"
      src={src}
      poster={poster || undefined}
      preload="none"
      controls
      playsInline
      aria-label={label}
    />
  );
}

export function NoJsAudio({ src, label }: { src: string; label: string }) {
  return (
    <audio
      data-no-js=""
      className="mt-3 w-full"
      src={src}
      preload="none"
      controls
      aria-label={label}
    />
  );
}
