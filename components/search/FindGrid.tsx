import Link from "next/link";
import { FindDirectoryCard } from "@/components/search/FindDirectoryCard";
import { buildFindHref } from "@/components/search/query";
import { gridShowMoreLabel, gridVisibleCount } from "@/lib/search/find-grid";
import type { SearchFilters, SearchRow } from "@/lib/search/rpc";

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
            <FindDirectoryCard
              row={row}
              filters={filters}
              view={{ layout: "grid", more: morePages }}
            />
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
