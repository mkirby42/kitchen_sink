import Link from "next/link";
import { CardIntroVideo } from "@/components/search/CardIntroVideo";
import { ConversationPeek } from "@/components/search/ConversationPeek";
import { TherapistCardDesktop } from "@/components/search/TherapistCardDesktop";
import { HiddenFromPublicBadge } from "@/components/directory/HiddenFromPublicBadge";
import { buildTherapistHref } from "@/components/search/query";
import { Card } from "@/components/ui/Card";
import { tagClass } from "@/components/ui/styles";
import { overlapCopy, searchCardLabels } from "@/lib/search/overlap";
import { modalityDisplayLabel } from "@/lib/tags/modality-display";
import type { SearchFilters, SearchRow } from "@/lib/search/rpc";
import {
  credentialTitle,
  initials,
  storagePublicUrl,
  yearsPracticing,
} from "@/lib/therapists/display";
import { MAYA_ID } from "@/lib/therapists/ids";
import { givenName } from "@/lib/therapists/load";

function cardInitials(name: string) {
  return initials(name.replace(/^(dr\.?|prof\.?)\s+/i, ""));
}

function conversationPeek(row: SearchRow) {
  const prompt = row.card_prompt?.trim() ?? "";
  const answer = row.card_answer?.trim() ?? "";
  if (!prompt || !answer) return null;
  return { prompt, answer, tag: row.card_tag ?? null };
}

function Avatar({ name, photo }: { name: string; photo: string | null }) {
  const classes = "size-16 shrink-0 overflow-hidden rounded-full";
  if (photo) {
    return (
      // Public Storage URLs; next/image is out of scope this weekend.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt=""
        width={64}
        height={64}
        className={`${classes} object-cover object-center`}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`flex items-center justify-center bg-clay font-display text-lg text-paper ${classes}`}
    >
      {cardInitials(name)}
    </span>
  );
}

export function TherapistCard({
  row,
  filters,
}: {
  row: SearchRow;
  filters: SearchFilters;
}) {
  const photo = storagePublicUrl("photos", row.photo_key);
  const videoUrl = storagePublicUrl("videos", row.video_key);
  const years = yearsPracticing(row.start_date_of_practice);
  const meta = [
    row.credential,
    years != null ? `${years} yr${years === 1 ? "" : "s"}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const sample = row.profile_id === MAYA_ID;
  const tags = searchCardLabels(row, filters.tags);
  const hits = overlapCopy(row.match_count, filters.tags.length);
  const card = conversationPeek(row);
  const href = buildTherapistHref(row.profile_id, filters);
  const given = givenName(row.name);
  const mark = cardInitials(row.name);
  const topicTags = tags.filter(
    (label) => label !== "Virtual" && label !== "In-Person",
  );
  const details = (
    <>
      <div className="flex items-start gap-4">
        {videoUrl ? null : <Avatar name={row.name} photo={photo} />}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-xl tracking-tight text-ink">
              {row.name}
            </h2>
            {sample ? (
              <span className="shrink-0 rounded-full bg-[#f3dc6b] px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-ink">
                SAMPLE
              </span>
            ) : null}
          </div>
          {meta ? <p className="mt-1 text-sm text-mute">{meta}</p> : null}
          {row.listed === false ? (
            <HiddenFromPublicBadge variant="card" />
          ) : null}
          {hits ? (
            <p className="mt-3 text-sm font-medium text-clay">{hits}</p>
          ) : null}
          {tags.length > 0 ? (
            <ul className={`flex flex-wrap gap-2 ${hits ? "mt-2" : "mt-3"}`}>
              {tags.map((label) => (
                <li key={label} className={tagClass(false)}>
                  {modalityDisplayLabel(label)}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      {card ? (
        <ConversationPeek
          prompt={card.prompt}
          answer={card.answer}
          tag={card.tag}
        />
      ) : null}
    </>
  );

  return (
    <Card as="article" className="overflow-hidden p-5 sm:p-6 md:p-0">
      <div data-find-card="phone" className="md:hidden">
        {videoUrl ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            <CardIntroVideo
              name={row.name}
              initials={mark}
              photoUrl={photo}
              videoUrl={videoUrl}
            />
            <Link href={href} className="block w-full min-w-0 sm:w-auto sm:flex-1">
              {details}
            </Link>
          </div>
        ) : (
          <Link href={href} className="block">
            {details}
          </Link>
        )}
      </div>
      <TherapistCardDesktop
        name={row.name}
        given={given}
        initials={mark}
        credential={credentialTitle(row.credential)}
        photoUrl={photo}
        videoUrl={videoUrl}
        virtual={row.virtual_practice}
        inPerson={row.in_person_practice}
        tags={topicTags}
        hits={hits}
        prompt={card?.prompt ?? null}
        answer={card?.answer ?? null}
        href={href}
        sample={sample}
        hidden={row.listed === false}
      />
    </Card>
  );
}
