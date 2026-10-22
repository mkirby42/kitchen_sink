import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FindDesktopFilters } from "@/components/search/FindDesktopFilters";
import { FindDesktopResults } from "@/components/search/FindDesktopResults";
import { PhoneFindSection } from "@/components/search/PhoneFindSection";
import { pageTitleClass } from "@/components/ui/styles";
import {
  buildFindHref,
  parseFindPageView,
  requestFindPageHref,
} from "@/components/search/query";
import { narrowSearchRows } from "@/lib/audience";
import { readAudienceCookie } from "@/lib/audience-cookie";
import { loadNavUser } from "@/lib/nav";
import { buildFindDetail } from "@/lib/search/find-detail";
import { parseFindSearchParams, searchTherapists } from "@/lib/search/rpc";
import { loadTherapistProfile } from "@/lib/therapists/load";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Find a therapist",
  description:
    "Search therapists by specialty, insurance, virtual or in-person, and license state.",
  alternates: { canonical: "/find" },
};

type FindPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FindPage({ searchParams }: FindPageProps) {
  const raw = await searchParams;
  const filters = parseFindSearchParams(raw);
  const view = parseFindPageView(raw);
  const clean = buildFindHref(filters, view);
  if (requestFindPageHref(raw) !== clean) redirect(clean);
  const [found, audience, nav] = await Promise.all([
    searchTherapists(filters),
    readAudienceCookie(),
    loadNavUser(),
  ]);
  const rows = found
    ? narrowSearchRows(found, {
        roleIsAdmin: nav?.role === "admin",
        audience,
      })
    : found;
  if (
    rows &&
    view.therapistId &&
    !rows.some((row) => row.profile_id === view.therapistId)
  ) {
    redirect(buildFindHref(filters, { layout: view.layout, more: view.more }));
  }
  const openRow =
    rows?.find((row) => row.profile_id === view.therapistId) ?? null;
  const opened = openRow
    ? await loadTherapistProfile(openRow.profile_id, audience)
    : null;
  const detail = openRow
    ? buildFindDetail({
        row: openRow,
        profile: opened,
        filterState: filters.state,
      })
    : null;

  return (
    <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16 md:max-w-7xl md:py-14">
      <div className="md:hidden">
        <PhoneFindSection rows={rows} />
      </div>

      <div className="hidden md:block">
        <Suspense fallback={null}>
          <FindDesktopFilters
            key={detail ? "detail" : "list"}
            matchCount={rows?.length ?? null}
            initialOpen={detail ? null : "topics"}
            leading={
              <h1 className={`shrink-0 text-left md:text-heading ${pageTitleClass}`}>
                Find your therapist
              </h1>
            }
          />
        </Suspense>
      </div>

      <div id="find-results" className="mt-8 hidden md:block">
        <FindDesktopResults
          rows={rows}
          filters={filters}
          view={view}
          detail={detail}
        />
      </div>
    </main>
  );
}
