import { buildTherapistHref } from "@/components/search/query";
import { TherapistCardDesktop } from "@/components/search/TherapistCardDesktop";
import { TherapistCardPhone } from "@/components/search/TherapistCardPhone";
import { Card } from "@/components/ui/Card";
import { overlapCopy, searchCardLabels } from "@/lib/search/overlap";
import type { SearchFilters, SearchRow } from "@/lib/search/rpc";
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

function conversationPeek(row: SearchRow) {
  const prompt = row.card_prompt?.trim() ?? "";
  const answer = row.card_answer?.trim() ?? "";
  if (!prompt || !answer) return null;
  return { prompt, answer };
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
  const code = row.credential?.trim() || null;

  return (
    <Card as="article" className="overflow-hidden p-0">
      <TherapistCardPhone
        name={row.name}
        given={given}
        initials={mark}
        credential={code}
        photoUrl={photo}
        videoUrl={videoUrl}
        virtual={row.virtual_practice}
        inPerson={row.in_person_practice}
        prompt={card?.prompt ?? null}
        answer={card?.answer ?? null}
        href={href}
        sample={sample}
        hidden={row.listed === false}
      />
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
