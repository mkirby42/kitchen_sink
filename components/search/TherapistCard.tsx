import Link from "next/link";
import { buildTherapistHref } from "@/components/search/query";
import {
  isMatchedLabel,
  overlapCopy,
  searchCardLabels,
} from "@/lib/search/overlap";
import type { SearchFilters, SearchRow } from "@/lib/search/rpc";
import {
  formatStartingRate,
  initials,
  storagePublicUrl,
  yearsPracticing,
} from "@/lib/therapists/display";
import { MAYA_ID } from "@/lib/therapists/ids";

function cardInitials(name: string) {
  return initials(name.replace(/^(dr\.?|prof\.?)\s+/i, ""));
}

function tagClass(hit: boolean) {
  return hit
    ? "rounded-full border border-clay bg-clay px-3 py-1 text-xs text-paper"
    : "rounded-full border border-line bg-cream px-3 py-1 text-xs text-ink";
}

function Avatar({ name, photo }: { name: string; photo: string | null }) {
  const classes =
    "size-16 shrink-0 overflow-hidden rounded-full";
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
  const years = yearsPracticing(row.start_date_of_practice);
  const rate = formatStartingRate(
    row.min_price_cents,
    row.min_duration_minutes,
  );
  const meta = [
    row.credential,
    years != null ? `${years} yr${years === 1 ? "" : "s"}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const sample = row.profile_id === MAYA_ID;
  const tags = searchCardLabels(row);
  const hits = overlapCopy(row.match_count, filters.tags.length);
  const matched = row.matched_labels ?? [];

  return (
    <Link
      href={buildTherapistHref(row.profile_id, filters)}
      className="block rounded-3xl border border-line bg-paper p-6 shadow-sm transition hover:border-ink/15"
    >
      <div className="flex items-start gap-4">
        <Avatar name={row.name} photo={photo} />
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
          {hits ? (
            <p className="mt-3 text-sm font-medium text-clay">{hits}</p>
          ) : null}
          {tags.length > 0 ? (
            <ul className={`flex flex-wrap gap-2 ${hits ? "mt-2" : "mt-3"}`}>
              {tags.map((label) => (
                <li
                  key={label}
                  className={tagClass(isMatchedLabel(label, matched))}
                >
                  {label}
                </li>
              ))}
            </ul>
          ) : null}
          {rate ? (
            <p className="mt-4 text-ink">
              {rate.price}
              {rate.duration ? (
                <span className="text-clay"> / {rate.duration}</span>
              ) : null}
            </p>
          ) : null}
          {row.sliding_scale ? (
            <p className={`${rate ? "mt-1" : "mt-4"} text-sm text-ink`}>
              Sliding scale available
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
