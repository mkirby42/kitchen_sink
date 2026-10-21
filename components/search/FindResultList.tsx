import { PhoneTherapistBrowse } from "@/components/search/PhoneTherapistBrowse";
import { TherapistCard } from "@/components/search/TherapistCard";
import {
  deskResultsClass,
  phoneBrowseKey,
} from "@/lib/search/phone-browse";
import type { SearchFilters, SearchRow } from "@/lib/search/rpc";

export function FindResultList({
  rows,
  filters,
}: {
  rows: SearchRow[];
  filters: SearchFilters;
}) {
  if (rows.length === 0) return null;

  const browseKey = phoneBrowseKey(
    filters,
    rows.map((row) => row.profile_id),
  );

  return (
    <>
      <PhoneTherapistBrowse
        key={browseKey}
        browseKey={browseKey}
        ids={rows.map((row) => row.profile_id)}
        names={rows.map((row) => row.name)}
      >
        {rows.map((row) => (
          <TherapistCard key={row.profile_id} row={row} filters={filters} />
        ))}
      </PhoneTherapistBrowse>
      <ul data-find-results="desk" className={deskResultsClass}>
        {rows.map((row) => (
          <li key={row.profile_id}>
            <TherapistCard row={row} filters={filters} />
          </li>
        ))}
      </ul>
    </>
  );
}
