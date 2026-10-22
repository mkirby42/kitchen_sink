import { buildTherapistHref } from "@/components/search/query";
import { TherapistCardDesktop } from "@/components/search/TherapistCardDesktop";
import { TherapistCardPhone } from "@/components/search/TherapistCardPhone";
import { Card } from "@/components/ui/Card";
import {
  desktopFormatBadge,
  desktopInsuranceLabels,
  desktopTopicLabels,
  findCredentialLine,
  licensedInLabel,
} from "@/lib/search/find-desktop";
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

export function TherapistCard({
  row,
  filters,
  variant = "both",
}: {
  row: SearchRow;
  filters: SearchFilters;
  /** Phone list and the desktop carousel each render one half. */
  variant?: "phone" | "desk" | "both";
}) {
  const photo = storagePublicUrl("photos", row.photo_key);
  const videoUrl = storagePublicUrl("videos", row.video_key);
  const sample = row.profile_id === MAYA_ID;
  const card = conversationPeek(row);
  const href = buildTherapistHref(row.profile_id, filters);
  const given = givenName(row.name);
  const mark = cardInitials(row.name);
  const licensed = licensedInLabel(filters.state);

  return (
    <Card as="article" className="overflow-hidden p-0">
      {variant === "desk" ? null : (
        <TherapistCardPhone row={row} filters={filters} />
      )}
      {variant === "phone" ? null : (
        <TherapistCardDesktop
          name={row.name}
          given={given}
          initials={mark}
          credentialLine={findCredentialLine(
            row.credential,
            row.start_date_of_practice,
          )}
          photoUrl={photo}
          videoUrl={videoUrl}
          formatBadge={desktopFormatBadge(
            row.virtual_practice,
            row.in_person_practice,
          )}
          topics={desktopTopicLabels(row.specialty_labels)}
          metaPills={[
            ...desktopInsuranceLabels(row.insurance_labels),
            ...(licensed ? [licensed] : []),
          ]}
          prompt={card?.prompt ?? null}
          answer={card?.answer ?? null}
          href={href}
          therapistId={row.profile_id}
          sample={sample}
          hidden={row.listed === false}
          draft={row.published === false}
        />
      )}
    </Card>
  );
}
