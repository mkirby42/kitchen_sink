import { Card } from "@/components/ui/Card";
import { mobileStreamAfterHero } from "@/lib/profile/mobile-stream";
import type { ProfileCard } from "@/lib/therapists/load";
import { HeroMedia } from "./HeroMedia";

export function MobileProfileStream({
  name,
  initials,
  photoUrl,
  videoUrl,
  licenseCaptions,
  years,
  cards,
}: {
  name: string;
  initials: string;
  photoUrl: string | null;
  videoUrl: string | null;
  licenseCaptions: string[];
  years: number | null;
  cards: ProfileCard[];
}) {
  const split = Boolean(photoUrl && videoUrl);
  const tail = mobileStreamAfterHero(split, cards);

  return (
    <div data-profile-layout="mobile" className="space-y-5 md:hidden">
      <header>
        <h1 className="font-display text-5xl leading-none font-semibold tracking-tight break-words text-ink">
          {name}
        </h1>
        {licenseCaptions.length > 0 ? (
          <div
            data-license-badge
            className="mt-3 inline-flex max-w-full items-center gap-2"
          >
            <span
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-paper"
              aria-hidden
            >
              <svg
                viewBox="0 0 16 16"
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path
                  d="M3.5 8.5 6.5 11.5 12.5 4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div className="min-w-0">
              {licenseCaptions.map((line) => (
                <p key={line} className="text-sm leading-snug text-ink">
                  {line}
                </p>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      <div data-lead-media>
        <HeroMedia
          name={name}
          initials={initials}
          photoUrl={photoUrl}
          videoUrl={split ? null : videoUrl}
          licenseCaptions={licenseCaptions}
          years={years}
          titleTag="p"
        />
      </div>

      {tail.length > 0 ? (
        <ul className="space-y-5">
          {tail.map((item, index) =>
            item.type === "media" ? (
              <li key="extra-media" data-extra-media>
                <HeroMedia
                  name={name}
                  initials={initials}
                  photoUrl={photoUrl}
                  videoUrl={videoUrl}
                  licenseCaptions={[]}
                  years={null}
                  showOverlay={false}
                  titleTag="p"
                  imageAlt=""
                />
              </li>
            ) : (
              <Card
                as="li"
                key={`${item.prompt.prompt}-${index}`}
                data-prompt-variant="hinge"
                className="px-6 py-8"
              >
                <p className="text-sm leading-snug text-ink">{item.prompt.prompt}</p>
                <p className="mt-3 font-display text-[1.7rem] leading-tight font-semibold tracking-tight text-ink">
                  {item.prompt.answer}
                </p>
              </Card>
            ),
          )}
        </ul>
      ) : null}
    </div>
  );
}
