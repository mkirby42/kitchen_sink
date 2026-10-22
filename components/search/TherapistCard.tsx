import { buildTherapistHref } from "@/components/search/query";
import { TherapistCardPhone } from "@/components/search/TherapistCardPhone";
import { Card } from "@/components/ui/Card";
import type { SearchFilters, SearchRow } from "@/lib/search/rpc";
import { initials, storagePublicUrl } from "@/lib/therapists/display";
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

/** Phone Find card. Desktop grid and one-at-a-time use FindDirectoryCard. */
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
  const card = conversationPeek(row);
  const href = buildTherapistHref(row.profile_id, filters);
  const given = givenName(row.name);
  const mark = cardInitials(row.name);
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
        therapistId={row.profile_id}
        sample={sample}
        hidden={row.listed === false}
        draft={row.published === false}
      />
    </Card>
  );
}
