import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FindDesktopFilters } from "@/components/search/FindDesktopFilters";
import { FindDesktopResults } from "@/components/search/FindDesktopResults";
import { FindFilters } from "@/components/search/FindFilters";
import { FindResultList } from "@/components/search/FindResultList";
import { Card } from "@/components/ui/Card";
import { pageTitleClass } from "@/components/ui/styles";
import {
  buildFindHref,
  parseFindPageView,
  requestFindPageHref,
  resultCountLabel,
} from "@/components/search/query";
import { narrowSearchRows } from "@/lib/audience";
import { readAudienceCookie } from "@/lib/audience-cookie";
import { loadNavUser } from "@/lib/nav";
import { buildFindDetail } from "@/lib/search/find-grid";
import {
  parseFindSearchParams,
  searchTherapists,
  type SearchFilters,
  type SearchRow,
} from "@/lib/search/rpc";
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
      <h1 className={`text-center md:hidden ${pageTitleClass}`}>
        Find your therapist
      </h1>

      <div className="mx-auto max-w-3xl md:hidden">
        <p className="mx-auto mt-6 max-w-xl text-center text-base leading-relaxed text-body sm:text-lg">
          Tap your must-haves below — we&apos;ll show therapists who match some
          selected tag.
        </p>

        <Card className="mt-10 px-5 py-8 sm:px-8 sm:py-10">
          <Suspense fallback={null}>
            <FindFilters />
          </Suspense>
        </Card>
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

      <div className="mt-10 space-y-6 md:hidden">
        <FindPhoneResults rows={rows} filters={filters} />
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

function FindPhoneResults({
  rows,
  filters,
}: {
  rows: SearchRow[] | null;
  filters: SearchFilters;
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
  return (
    <>
      <p className="text-sm text-mute">{resultCountLabel(rows.length)}</p>
      <FindResultList rows={rows} filters={filters} />
    </>
  );
}

