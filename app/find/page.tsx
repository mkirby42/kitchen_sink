import type { Metadata } from "next";
import { Suspense } from "react";
import { FindFilters } from "@/components/search/FindFilters";
import { TherapistCard } from "@/components/search/TherapistCard";
import { resultCountLabel } from "@/components/search/query";
import { parseFindSearchParams, searchTherapists } from "@/lib/search/rpc";

export const metadata: Metadata = {
  title: "Find a therapist",
};

type FindPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FindPage({ searchParams }: FindPageProps) {
  const filters = parseFindSearchParams(await searchParams);
  const rows = await searchTherapists(filters);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-display text-clay" aria-hidden>
        ~
      </p>
      <h1 className="font-display text-4xl tracking-tight">
        Find your <em className="text-clay">therapist</em>
      </h1>
      <p className="mt-3 text-mute">
        Tap your must-haves below — we&apos;ll show therapists who match some
        selected tag.
      </p>

      <div className="mt-10">
        <Suspense fallback={null}>
          <FindFilters />
        </Suspense>
      </div>

      <div className="mt-8 space-y-6">
        {rows === null ? (
          <p className="rounded-3xl border border-line bg-paper px-6 py-10 text-center text-mute">
            Therapist search isn&apos;t available right now.
          </p>
        ) : rows.length === 0 ? (
          <p className="rounded-3xl border border-line bg-paper px-6 py-10 text-center text-mute">
            No therapists match
          </p>
        ) : (
          <>
            <p className="text-sm text-mute">
              {resultCountLabel(rows.length)}
            </p>
            <ul className="space-y-4">
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
