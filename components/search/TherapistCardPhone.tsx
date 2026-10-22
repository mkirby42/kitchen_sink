import { FindCardLink } from "@/components/analytics/FindCardLink";
import { HiddenFromPublicBadge } from "@/components/directory/HiddenFromPublicBadge";
import { VideoStill } from "@/components/ui/VideoStill";
import { promptAnswerClass, promptLabelClass } from "@/components/profile/prompt-type";
import { buildTherapistHref } from "@/components/search/query";
import { metaLineClass } from "@/components/ui/styles";
import { phoneListFacts } from "@/lib/search/phone-find";
import { desktopFormatBadge } from "@/lib/search/find-desktop";
import type { SearchFilters, SearchRow } from "@/lib/search/rpc";
import { DRAFT_PROFILE_LABEL } from "@/lib/therapists/listing";
import {
  credentialTitle,
  initials,
  storagePublicUrl,
} from "@/lib/therapists/display";
import { MAYA_ID } from "@/lib/therapists/ids";
import { givenName } from "@/lib/therapists/load";

function cardInitials(name: string) {
  return initials(name.replace(/^(dr\.?|prof\.?)\s+/i, ""));
}

export function TherapistCardPhone({
  row,
  filters,
}: {
  row: SearchRow;
  filters: SearchFilters;
}) {
  const photoUrl = storagePublicUrl("photos", row.photo_key);
  const videoUrl = storagePublicUrl("videos", row.video_key);
  const prompt = row.card_prompt?.trim() ?? "";
  const answer = row.card_answer?.trim() ?? "";
  const showCard = Boolean(prompt && answer);
  const format = desktopFormatBadge(row.virtual_practice, row.in_person_practice);
  const credential = credentialTitle(row.credential);
  const facts = phoneListFacts(row, filters);
  const href = buildTherapistHref(row.profile_id, filters);
  const given = givenName(row.name);
  const mark = cardInitials(row.name);

  return (
    <FindCardLink
      href={href}
      therapistId={row.profile_id}
      data-find-card="phone"
      aria-label={`Get to know ${given}`}
      className="flex gap-3 p-3 md:hidden"
    >
      <span className="relative size-[4.5rem] shrink-0 overflow-hidden rounded-2xl bg-heading">
        {photoUrl ? (
          // Public Storage URLs; next/image is out of scope this weekend.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[center_18%]"
          />
        ) : videoUrl ? (
          <VideoStill src={videoUrl} />
        ) : (
          <span
            aria-hidden
            className="absolute inset-0 flex items-center justify-center font-sans text-lg font-medium text-white"
          >
            {mark}
          </span>
        )}
        {videoUrl ? (
          <span
            aria-hidden
            className="absolute right-1 bottom-1 flex size-6 items-center justify-center rounded-full bg-paper text-ink shadow-card"
          >
            <svg viewBox="0 0 24 24" className="ml-0.5 h-3 w-3 fill-current">
              <path d="M9 7.2v9.6l8.2-4.8L9 7.2z" />
            </svg>
          </span>
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        {format ? (
          <span data-find-formats className={`block ${metaLineClass}`}>
            {format}
          </span>
        ) : null}
        <span className="mt-0.5 flex flex-wrap items-center gap-2">
          <h2 className="font-sans text-[17px] leading-6 font-medium text-copy">
            {row.name}
          </h2>
          {row.profile_id === MAYA_ID ? (
            <span className="shrink-0 rounded-full bg-gold px-2 py-0.5 text-[11px] font-medium tracking-wide text-black">
              SAMPLE
            </span>
          ) : null}
        </span>
        {credential ? <span className={`mt-0.5 block ${metaLineClass}`}>{credential}</span> : null}
        {showCard ? (
          <span className="mt-1.5 block">
            <span className={`block ${promptLabelClass}`}>{prompt}</span>
            <span className={`line-clamp-3 ${promptAnswerClass}`}>{answer}</span>
          </span>
        ) : null}
        {facts.length > 0 ? (
          <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {facts.map((fact) => (
              <span key={fact} className="inline-flex items-center gap-1 text-[13px] leading-5 text-copy">
                <svg viewBox="0 0 16 16" className="size-3.5 shrink-0 text-heading" aria-hidden>
                  <path
                    d="M3.5 8.2 6.4 11l6.1-6.2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {fact}
              </span>
            ))}
          </span>
        ) : null}
        {row.published === false ? (
          <HiddenFromPublicBadge variant="card" label={DRAFT_PROFILE_LABEL} />
        ) : null}
        {row.listed === false ? <HiddenFromPublicBadge variant="card" /> : null}
      </span>
    </FindCardLink>
  );
}
