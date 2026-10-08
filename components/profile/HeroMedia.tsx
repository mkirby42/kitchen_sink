"use client";

import { useState } from "react";

type HeroMediaProps = {
  name: string;
  initials: string;
  photoUrl: string | null;
  videoUrl: string | null;
  licenseCaptions: string[];
  years: number | null;
  /** False on a second mobile card so the name stays on the lead frame. */
  showOverlay?: boolean;
  /** Mobile puts the page title in the header, so that frame uses a paragraph. */
  titleTag?: "h1" | "p";
  imageAlt?: string;
};

export function HeroMedia({
  name,
  initials,
  photoUrl,
  videoUrl,
  licenseCaptions,
  years,
  showOverlay = true,
  titleTag = "h1",
  imageAlt,
}: HeroMediaProps) {
  const [playing, setPlaying] = useState(false);
  const showVideo = Boolean(videoUrl && playing);
  const alt = imageAlt ?? name;

  const yearsLabel =
    years == null ? null : `${years} yr${years === 1 ? "" : "s"} practicing`;
  const showNameBelow = showOverlay && showVideo;
  const showDetails = showNameBelow || Boolean(yearsLabel);

  return (
    <div data-hero-overlay={showOverlay ? "true" : "false"}>
      <div
        data-hero-media
        className="relative isolate overflow-hidden rounded-[2rem] bg-ink shadow-sm"
      >
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
              alt={alt}
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
          ) : null}

          {showOverlay && !showVideo ? (
            <>
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink/75 via-ink/40 via-[35%] to-transparent"
                aria-hidden
              />
              <div
                className="absolute inset-x-0 bottom-0 p-5"
                aria-hidden={titleTag === "p" ? true : undefined}
              >
                <HeroTitle
                  tag={titleTag}
                  className="font-display text-4xl leading-tight tracking-tight text-paper drop-shadow-[0_1px_8px_rgba(27,39,68,0.65)]"
                >
                  {name}
                </HeroTitle>
                {licenseCaptions.length > 0 ? (
                  <div className="mt-1.5 space-y-0.5">
                    {licenseCaptions.map((line) => (
                      <p
                        key={line}
                        className="text-sm leading-snug text-paper/95 drop-shadow-[0_1px_6px_rgba(27,39,68,0.7)]"
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {showDetails ? (
        <div data-hero-details className="mt-4">
          {showNameBelow ? (
            <div aria-hidden={titleTag === "p" ? true : undefined}>
              <HeroTitle
                tag={titleTag}
                className="font-display text-4xl leading-tight tracking-tight text-ink"
              >
                {name}
              </HeroTitle>
              {licenseCaptions.length > 0 ? (
                <div className="mt-1 space-y-0.5">
                  {licenseCaptions.map((line) => (
                    <p key={line} className="text-sm text-mute">
                      {line}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          {yearsLabel ? (
            <p className={showNameBelow ? "mt-1 text-sm text-mute" : "text-sm text-mute"}>
              {yearsLabel}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function HeroTitle({
  tag,
  className,
  children,
}: {
  tag: "h1" | "p";
  className: string;
  children: string;
}) {
  if (tag === "p") return <p className={className}>{children}</p>;
  return <h1 className={className}>{children}</h1>;
}
