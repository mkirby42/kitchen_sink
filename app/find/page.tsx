import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FindFilters } from "@/components/search/FindFilters";
import { TherapistCard } from "@/components/search/TherapistCard";
import { Card } from "@/components/ui/Card";
import { pageTitleClass } from "@/components/ui/styles";
import {
  buildFindHref,
  requestFindHref,
  resultCountLabel,
} from "@/components/search/query";
import { narrowSearchRows } from "@/lib/audience";
import { readAudienceCookie } from "@/lib/audience-cookie";
import { loadNavUser } from "@/lib/nav";
import { parseFindSearchParams, searchTherapists } from "@/lib/search/rpc";

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
    <main className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <h1 className={`text-center ${pageTitleClass}`}>
          Find your therapist
        </h1>
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

      <div className="mt-10 space-y-6">
        {rows === null ? (
          <Card as="div" className="px-6 py-10 text-center text-mute">
            <p>Therapist search isn&apos;t available right now.</p>
          </Card>
        ) : rows.length === 0 ? (
          <Card as="div" className="px-6 py-10 text-center text-mute">
            <p>No therapists match</p>
          </Card>
        ) : (
          <>
            <p className="text-sm text-mute">
              {resultCountLabel(rows.length)}
            </p>
            <ul className="space-y-6">
              {rows.map((row) => (
                <li key={row.profile_id}>
                  <TherapistCard row={row} filters={filters} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
