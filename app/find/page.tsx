import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FindCarousel } from "@/components/search/FindCarousel";
import { FindDesktopFilters } from "@/components/search/FindDesktopFilters";
import { PhoneFindSection } from "@/components/search/PhoneFindSection";
import { TherapistCard } from "@/components/search/TherapistCard";
import { Card } from "@/components/ui/Card";
import { pageTitleClass } from "@/components/ui/styles";
import { buildFindHref, requestFindHref } from "@/components/search/query";
import { narrowSearchRows } from "@/lib/audience";
import { readAudienceCookie } from "@/lib/audience-cookie";
import { loadNavUser } from "@/lib/nav";
import {
  parseFindSearchParams,
  searchTherapists,
  type SearchFilters,
  type SearchRow,
} from "@/lib/search/rpc";

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
  const clean = buildFindHref(filters);
  if (requestFindHref(raw) !== clean) redirect(clean);
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

  return (
    <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16 md:max-w-6xl md:py-14">
      <h1 className={`hidden text-left md:block md:text-heading ${pageTitleClass}`}>
        Find your therapist
      </h1>

      <div className="hidden md:block">
        <Suspense fallback={null}>
          <FindDesktopFilters matchCount={rows?.length ?? null} />
        </Suspense>
      </div>

      <div className="md:hidden">
        <PhoneFindSection rows={rows} />
      </div>

      <div id="find-results" className="mt-8 hidden md:block">
        <FindDesktopResults rows={rows} filters={filters} />
      </div>
    </main>
  );
}

function FindDesktopResults({
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
    <FindCarousel
      slides={rows.map((row) => ({
        id: row.profile_id,
        card: <TherapistCard row={row} filters={filters} variant="desk" />,
      }))}
    />
  );
}
