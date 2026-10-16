import { FindCardLink } from "@/components/analytics/FindCardLink";
import { CardIntroVideo } from "@/components/search/CardIntroVideo";
import { HiddenFromPublicBadge } from "@/components/directory/HiddenFromPublicBadge";
import { DRAFT_PROFILE_LABEL } from "@/lib/therapists/listing";
import { SessionFormatLine } from "@/components/profile/SessionFormatLine";
import { promptAnswerClass, promptLabelClass } from "@/components/profile/prompt-type";
import { metaLineClass, primaryPillClass, therapistNameClass } from "@/components/ui/styles";
import { sessionFormatPills } from "@/lib/therapists/load";

export function TherapistCardPhone({
  name,
  given,
  initials,
  credential,
  photoUrl,
  videoUrl,
  virtual,
  inPerson,
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
  credential: string | null;
  photoUrl: string | null;
  videoUrl: string | null;
  virtual: boolean;
  inPerson: boolean;
  prompt: string | null;
  answer: string | null;
  href: string;
  therapistId: string;
  sample: boolean;
  hidden: boolean;
  draft?: boolean;
}) {
  const portrait = Boolean(photoUrl || videoUrl);
  const knowLabel = `Get to know ${given}`;
  const code = credential?.trim() || null;
  const formats = sessionFormatPills(virtual, inPerson);

  return (
    <div data-find-card="phone" className="md:hidden">
      {videoUrl ? (
        <CardIntroVideo
          name={name}
          photoUrl={photoUrl}
          videoUrl={videoUrl}
        />
      ) : photoUrl ? (
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-black">
          {/* Public Storage URLs; next/image is out of scope this weekend. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[center_18%]"
          />
        </div>
      ) : null}

      <div className="px-5 pt-5 pb-5">
        <div className="flex items-start gap-3">
          {portrait ? null : (
            <span
              aria-hidden
              className="flex size-14 shrink-0 items-center justify-center rounded-full bg-heading font-sans text-lg font-medium text-white"
            >
              {initials}
            </span>
          )}
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className={therapistNameClass}>{name}</h2>
            {sample ? (
              <span className="shrink-0 rounded-full bg-gold px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-black">
                SAMPLE
              </span>
            ) : null}
          </div>
        </div>

        {code || formats.length > 0 ? (
          <div className="mt-2.5 flex items-center gap-3">
            {code ? <p className={metaLineClass}>{code}</p> : null}
            {formats.length > 0 ? (
              <div data-find-formats className="ml-auto flex shrink-0 justify-end">
                <SessionFormatLine formats={formats} />
              </div>
            ) : null}
          </div>
        ) : null}

        {draft ? (
          <HiddenFromPublicBadge variant="card" label={DRAFT_PROFILE_LABEL} />
        ) : null}
        {hidden ? <HiddenFromPublicBadge variant="card" /> : null}

        {prompt && answer ? (
          <div className="mt-5">
            <p className={promptLabelClass}>{prompt}</p>
            <p className={promptAnswerClass}>{answer}</p>
          </div>
        ) : null}

        <FindCardLink
          href={href}
          therapistId={therapistId}
          className={`${primaryPillClass} mt-6 w-full px-6 py-3.5 text-center`}
        >
          {knowLabel}
        </FindCardLink>
      </div>
    </div>
  );
}
