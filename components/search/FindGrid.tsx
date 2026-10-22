import Link from "next/link";
import { FindCardLink } from "@/components/analytics/FindCardLink";
import { GridCardMedia } from "@/components/search/GridCardMedia";
import { HiddenFromPublicBadge } from "@/components/directory/HiddenFromPublicBadge";
import { CheckMark, ClockMark } from "@/components/search/find-marks";
import { Card } from "@/components/ui/Card";
import { buildFindHref, type FindPageView } from "@/components/search/query";
import {
  desktopFormatBadge,
} from "@/lib/search/find-desktop";
import {
  gridShowMoreLabel,
  gridVisibleCount,
  gridYearsLabel,
  takesInsuranceLine,
} from "@/lib/search/find-grid";
import type { SearchFilters, SearchRow } from "@/lib/search/rpc";
import { credentialTitle, storagePublicUrl } from "@/lib/therapists/display";
import { DRAFT_PROFILE_LABEL } from "@/lib/therapists/listing";
import { MAYA_ID } from "@/lib/therapists/ids";

export function FindGrid({
  rows,
  filters,
  morePages,
}: {
  rows: SearchRow[];
  filters: SearchFilters;
  morePages: number;
}) {
  const visible = gridVisibleCount(rows.length, morePages);
  const shown = rows.slice(0, visible);
  const moreLabel = gridShowMoreLabel(rows.length, visible);
  const moreHref = buildFindHref(filters, {
    layout: "grid",
    more: morePages + 1,
  });

  return (
    <div data-find-layout="grid">
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
        {shown.map((row) => (
          <li key={row.profile_id} className="min-w-0">
            <GridCard row={row} filters={filters} morePages={morePages} />
          </li>
        ))}
      </ul>
      {moreLabel ? (
        <div className="mt-8 flex justify-center">
          <Link
            href={moreHref}
            scroll={false}
            data-find-more={String(Math.min(morePages + 1, 3))}
            className="inline-flex items-center rounded-full border border-line bg-paper px-6 py-3 font-sans text-[15px] font-medium text-ink shadow-card"
          >
            {moreLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function GridCard({
  row,
  filters,
  morePages,
}: {
  row: SearchRow;
  filters: SearchFilters;
  morePages: number;
}) {
  const view: Partial<FindPageView> = {
    layout: "grid",
    more: morePages,
    therapistId: row.profile_id,
  };
  const href = buildFindHref(filters, view);
  const photoUrl = storagePublicUrl("photos", row.photo_key);
  const videoUrl = storagePublicUrl("videos", row.video_key);
  const prompt = row.card_prompt?.trim() ?? "";
  const answer = row.card_answer?.trim() ?? "";
  const credential = credentialTitle(row.credential);
  const takes = takesInsuranceLine(row.insurance_labels, filters.tags);
  const years = gridYearsLabel(row.start_date_of_practice);
  const formatBadge = desktopFormatBadge(
    row.virtual_practice,
    row.in_person_practice,
  );

  return (
    <Card
      as="article"
      data-find-card="grid"
      className="flex h-full flex-col overflow-hidden p-0"
    >
      <GridCardMedia
        name={row.name}
        photoUrl={photoUrl}
        videoUrl={videoUrl}
        formatBadge={formatBadge}
        href={href}
        therapistId={row.profile_id}
      />
      <div className="flex flex-1 flex-col px-4 pt-4 pb-4">
        <FindCardLink
          href={href}
          therapistId={row.profile_id}
          className="flex flex-1 flex-col"
        >
          <span className="flex flex-wrap items-center gap-2">
            <h2 className="font-sans text-[18px] leading-6 font-medium text-copy">
              {row.name}
            </h2>
            {row.profile_id === MAYA_ID ? (
              <span className="shrink-0 rounded-full bg-gold px-2 py-0.5 text-[10px] font-medium tracking-wide text-black">
                SAMPLE
              </span>
            ) : null}
          </span>
          {credential ? (
            <span className="mt-1 font-sans text-[13px] leading-5 text-meta">
              {credential}
            </span>
          ) : null}
          {row.published === false ? (
            <HiddenFromPublicBadge variant="card" label={DRAFT_PROFILE_LABEL} />
          ) : null}
          {row.listed === false ? <HiddenFromPublicBadge variant="card" /> : null}
          {prompt && answer ? (
            <span className="mt-3 block">
              <span className="block font-sans text-[13px] leading-5 text-meta">
                {prompt}
              </span>
              <span className="mt-1 line-clamp-4 font-display text-[16px] leading-6 text-copy">
                {answer}
              </span>
            </span>
          ) : null}
          {takes || years ? (
            <span className="mt-auto block pt-3">
              {takes ? (
                <span className="flex items-center gap-1.5 font-sans text-[13px] leading-5 font-medium text-[#1F7A4A]">
                  <CheckMark />
                  {takes}
                </span>
              ) : null}
              {years ? (
                <span className="mt-1 flex items-center gap-1.5 font-sans text-[13px] leading-5 text-meta">
                  <ClockMark />
                  {years}
                </span>
              ) : null}
            </span>
          ) : null}
        </FindCardLink>
      </div>
    </Card>
  );
}
