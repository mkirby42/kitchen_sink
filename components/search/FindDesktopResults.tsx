import { FindCarousel } from "@/components/search/FindCarousel";
import { FindDesktopDetail } from "@/components/search/FindDesktopDetail";
import { FindDirectoryCard } from "@/components/search/FindDirectoryCard";
import { FindGrid } from "@/components/search/FindGrid";
import { FindLayoutToggle } from "@/components/search/FindLayoutToggle";
import { buildFindHref, type FindPageView } from "@/components/search/query";
import { Card } from "@/components/ui/Card";
import type { FindDetailContent } from "@/lib/search/find-detail";
import { gridFitLine } from "@/lib/search/find-grid";
import type { SearchFilters, SearchRow } from "@/lib/search/rpc";

export function FindDesktopResults({
  rows,
  filters,
  view,
  detail,
}: {
  rows: SearchRow[] | null;
  filters: SearchFilters;
  view: FindPageView;
  detail: FindDetailContent | null;
}) {
  if (rows === null) {
    return (
      <Card as="div" className="px-6 py-10 text-center text-mute">
        <p>Therapist search isn&apos;t available right now.</p>
      </Card>
    );
  }
  if (rows.length === 0) {
    return (
      <Card as="div" className="px-6 py-10 text-center text-mute">
        <p>No therapists match</p>
      </Card>
    );
  }
  if (detail) {
    const index = rows.findIndex((row) => row.profile_id === detail.id);
    const previous = index > 0 ? rows[index - 1] : undefined;
    const next =
      index >= 0 && index < rows.length - 1 ? rows[index + 1] : undefined;
    const kept = {
      layout: view.layout,
      more: view.layout === "grid" ? view.more : 0,
    };
    return (
      <FindDesktopDetail
        detail={detail}
        index={Math.max(0, index)}
        count={rows.length}
        previousHref={
          previous
            ? buildFindHref(filters, { ...kept, therapistId: previous.profile_id })
            : null
        }
        nextHref={
          next
            ? buildFindHref(filters, { ...kept, therapistId: next.profile_id })
            : null
        }
        backHref={buildFindHref(filters, kept)}
      />
    );
  }

  return (
    <div data-find-results="desk">
      <div
        className={`mb-5 flex flex-wrap items-center gap-3 ${view.layout === "grid" ? "justify-between" : "justify-end"}`}
      >
        {view.layout === "grid" ? (
          <p className="font-sans text-[15px] leading-6 text-copy">
            {gridFitLine(rows.length)}
            <span className="text-meta"> · Click anyone to see their full profile</span>
          </p>
        ) : null}
        <FindLayoutToggle filters={filters} layout={view.layout} />
      </div>
      {view.layout === "one" ? (
        <FindCarousel
          slides={rows.map((row) => ({
            id: row.profile_id,
            card: (
              <FindDirectoryCard
                row={row}
                filters={filters}
                view={{ layout: "one" }}
              />
            ),
          }))}
        />
      ) : (
        <FindGrid rows={rows} filters={filters} morePages={view.more} />
      )}
    </div>
  );
}
