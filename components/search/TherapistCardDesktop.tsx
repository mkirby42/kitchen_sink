import Link from "next/link";
import { CardIntroVideo } from "@/components/search/CardIntroVideo";
import { HiddenFromPublicBadge } from "@/components/directory/HiddenFromPublicBadge";
import { DRAFT_PROFILE_LABEL } from "@/lib/therapists/listing";
import { SessionFormatLine } from "@/components/profile/SessionFormatLine";
import { promptAnswerClass, promptLabelClass } from "@/components/profile/prompt-type";
import { sentenceCasePhrase } from "@/lib/copy/sentence-case";
import { sessionFormatPills } from "@/lib/therapists/load";
import { modalityDisplayLabel } from "@/lib/tags/modality-display";
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
  draft = false,
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
  draft?: boolean;
}) {
  const portrait = Boolean(photoUrl || videoUrl);
  const knowLabel = `Get to know ${given}`;
  const formats = sessionFormatPills(virtual, inPerson);

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
                className="flex size-16 shrink-0 items-center justify-center rounded-full bg-heading font-sans text-lg font-medium text-white"
              >
                {initials}
              </span>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className={therapistNameClass}>{name}</h2>
                {sample ? (
                  <span className="shrink-0 rounded-full bg-gold px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-black">
                    SAMPLE
                  </span>
                ) : null}
              </div>
              {credential ? (
                <p className={`mt-2 ${metaLineClass}`}>{credential}</p>
              ) : null}
              {draft ? (
                <HiddenFromPublicBadge variant="card" label={DRAFT_PROFILE_LABEL} />
              ) : null}
              {hidden ? <HiddenFromPublicBadge variant="card" /> : null}
            </div>
          </div>
          {virtual || inPerson ? (
            <div
              data-find-formats
              className="flex shrink-0 flex-wrap justify-end gap-2"
            >
              <SessionFormatLine formats={formats} />
            </div>
          ) : null}
        </div>

        {prompt && answer ? (
          <div className="mt-6">
            <p className={promptLabelClass}>{prompt}</p>
            <p className={promptAnswerClass}>{answer}</p>
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
                className={softTagClass}
              >
                {sentenceCasePhrase(modalityDisplayLabel(label))}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto pt-6">
          <div className="border-t border-line pt-5">
            <div className="flex justify-end">
              <Link
                href={href}
                className={`${primaryPillClass} px-6 py-3`}
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
