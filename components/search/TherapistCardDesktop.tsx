import Link from "next/link";
import { CardIntroVideo } from "@/components/search/CardIntroVideo";
import { HiddenFromPublicBadge } from "@/components/directory/HiddenFromPublicBadge";
import { modalityDisplayLabel } from "@/lib/tags/modality-display";

function CameraIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <rect x="3" y="7" width="12" height="10" rx="1.5" />
      <path d="M15 11.2 20.5 8.2v7.6L15 12.8" strokeLinejoin="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <path
        d="M12 21s6-5.1 6-10a6 6 0 1 0-12 0c0 4.9 6 10 6 10z"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11" r="1.7" />
    </svg>
  );
}

function FormatPill({
  icon,
  label,
}: {
  icon: "camera" | "pin";
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-2.5 py-1 text-xs text-mute">
      {icon === "camera" ? <CameraIcon /> : <PinIcon />}
      {label}
    </span>
  );
}

export function TherapistCardDesktop({
  name,
  given,
  initials,
  credential,
  photoUrl,
  videoUrl,
  virtual,
  inPerson,
  tags,
  hits,
  prompt,
  answer,
  href,
  sample,
  hidden,
}: {
  name: string;
  given: string;
  initials: string;
  credential: string | null;
  photoUrl: string | null;
  videoUrl: string | null;
  virtual: boolean;
  inPerson: boolean;
  tags: string[];
  hits: string | null;
  prompt: string | null;
  answer: string | null;
  href: string;
  sample: boolean;
  hidden: boolean;
}) {
  const portrait = Boolean(photoUrl || videoUrl);
  const knowLabel = `Get to know ${given}`;

  return (
    <div
      data-find-card="desk"
      className={
        portrait
          ? "hidden md:grid md:grid-cols-[minmax(0,31%)_minmax(0,1fr)]"
          : "hidden md:block"
      }
    >
      {portrait ? (
        <div className="relative min-h-72 bg-black">
          {videoUrl ? (
            <CardIntroVideo
              variant="portrait"
              name={name}
              given={given}
              initials={initials}
              photoUrl={photoUrl}
              videoUrl={videoUrl}
            />
          ) : photoUrl ? (
            // Public Storage URLs; next/image is out of scope this weekend.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-[center_18%]"
            />
          ) : null}
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col px-8 py-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            {portrait ? null : (
              <span
                aria-hidden
                className="flex size-16 shrink-0 items-center justify-center rounded-full bg-ink font-sans text-lg font-semibold text-paper"
              >
                {initials}
              </span>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-sans text-[1.75rem] leading-none font-bold tracking-tight text-black lg:text-[2rem]">
                  {name}
                </h2>
                {sample ? (
                  <span className="shrink-0 rounded-full bg-gold px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-black">
                    SAMPLE
                  </span>
                ) : null}
              </div>
              {credential ? (
                <p className="mt-2 text-sm text-mute">{credential}</p>
              ) : null}
              {hidden ? <HiddenFromPublicBadge variant="card" /> : null}
            </div>
          </div>
          {virtual || inPerson ? (
            <div
              data-find-formats
              className="flex shrink-0 flex-wrap justify-end gap-2"
            >
              {virtual ? <FormatPill icon="camera" label="Virtual" /> : null}
              {inPerson ? <FormatPill icon="pin" label="In-Person" /> : null}
            </div>
          ) : null}
        </div>

        {prompt && answer ? (
          <div className="mt-6">
            <p className="text-sm font-medium leading-snug text-ink">
              <span aria-hidden className="mr-1.5">
                ✦
              </span>
              {prompt}
            </p>
            <p className="mt-2 font-display text-[1.75rem] leading-snug font-normal tracking-tight text-pretty text-black lg:text-[2rem]">
              <span
                aria-hidden
                className="mr-1 inline-block translate-y-1 font-display text-[2.8rem] leading-none font-normal text-mute/35"
              >
                “
              </span>
              {answer}
            </p>
          </div>
        ) : null}

        {hits ? (
          <p className="mt-5 text-xs font-medium text-mute">{hits}</p>
        ) : null}

        {tags.length > 0 ? (
          <ul
            data-find-tags
            className={`flex flex-wrap gap-2 ${hits ? "mt-2" : "mt-5"}`}
          >
            {tags.map((label) => (
              <li
                key={label}
                className="rounded-full border border-line bg-paper px-3 py-1 text-[13px] font-medium text-ink"
              >
                {modalityDisplayLabel(label)}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto pt-6">
          <div className="border-t border-line pt-5">
            <div className="flex justify-end">
              <Link
                href={href}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[15px] font-semibold text-paper transition-colors hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                {knowLabel}
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
