import { FindCardLink } from "@/components/analytics/FindCardLink";
import { CardIntroVideo } from "@/components/search/CardIntroVideo";
import { HiddenFromPublicBadge } from "@/components/directory/HiddenFromPublicBadge";
import { DRAFT_PROFILE_LABEL } from "@/lib/therapists/listing";
import { promptAnswerClass } from "@/components/profile/prompt-type";
import { desktopPromptHeading } from "@/lib/search/find-desktop";
import {
  metaLineClass,
  primaryPillClass,
  softTagClass,
  therapistNameClass,
} from "@/components/ui/styles";

export function TherapistCardDesktop({
  name,
  given,
  initials,
  credentialLine,
  photoUrl,
  videoUrl,
  formatBadge,
  topics,
  metaPills,
  prompt,
  answer,
  href,
  therapistId,
  sample,
  hidden,
  draft = false,
}: {
  name: string;
  given: string;
  initials: string;
  credentialLine: string | null;
  photoUrl: string | null;
  videoUrl: string | null;
  formatBadge: string | null;
  topics: string[];
  metaPills: string[];
  prompt: string | null;
  answer: string | null;
  href: string;
  therapistId: string;
  sample: boolean;
  hidden: boolean;
  draft?: boolean;
}) {
  const portrait = Boolean(photoUrl || videoUrl);
  const heading = desktopPromptHeading(prompt);
  const knowLabel = `Get to know ${given}`;

  return (
    <div
      data-find-card="desk"
      className={
        portrait
          ? "hidden md:grid md:min-h-[26rem] md:grid-cols-2"
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
          {formatBadge ? <FormatBadge label={formatBadge} floating /> : null}
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col px-7 py-7 sm:px-8">
        {portrait ? null : (
          <div className="mb-4 flex items-center gap-4">
            <span
              aria-hidden
              className="flex size-16 shrink-0 items-center justify-center rounded-full bg-heading font-sans text-lg font-medium text-white"
            >
              {initials}
            </span>
            {formatBadge ? <FormatBadge label={formatBadge} /> : null}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <h2 className={therapistNameClass}>{name}</h2>
          {sample ? (
            <span className="shrink-0 rounded-full bg-gold px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-black">
              SAMPLE
            </span>
          ) : null}
        </div>
        {credentialLine ? (
          <p className={`mt-2 ${metaLineClass}`}>{credentialLine}</p>
        ) : null}
        {draft ? (
          <HiddenFromPublicBadge variant="card" label={DRAFT_PROFILE_LABEL} />
        ) : null}
        {hidden ? <HiddenFromPublicBadge variant="card" /> : null}

        {heading && answer ? (
          <div className="mt-5 rounded-[20px] bg-pill-bg px-5 py-4">
            <p className="font-sans text-[11px] leading-4 font-medium tracking-[0.16em] text-prompt">
              {heading}
            </p>
            <p className={promptAnswerClass}>{answer}</p>
          </div>
        ) : null}

        {topics.length > 0 ? (
          <div className="mt-5">
            <p className="font-sans text-[15px] font-medium text-copy">
              Can help with
            </p>
            <ul data-find-topics className="mt-2 flex flex-wrap gap-2">
              {topics.map((label) => (
                <li key={label} className={softTagClass}>
                  {label}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {metaPills.length > 0 ? (
          <ul data-find-meta className="mt-3 flex flex-wrap gap-2">
            {metaPills.map((label) => (
              <li key={label} className={softTagClass}>
                {label}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
          <FindCardLink
            href={href}
            therapistId={therapistId}
            className={`${primaryPillClass} px-6 py-3`}
          >
            {knowLabel}
            <span aria-hidden>→</span>
          </FindCardLink>
        </div>
      </div>
    </div>
  );
}

function FormatBadge({
  label,
  floating = false,
}: {
  label: string;
  floating?: boolean;
}) {
  return (
    <p
      data-find-formats
      className={
        floating
          ? "absolute top-4 left-4 z-20 rounded-full bg-paper px-3 py-1 font-sans text-[14px] font-medium text-ink shadow-[0_8px_20px_rgb(23_23_23/0.12)]"
          : "rounded-full border border-line bg-paper px-3 py-1 font-sans text-[14px] font-medium text-ink"
      }
    >
      {label}
    </p>
  );
}
