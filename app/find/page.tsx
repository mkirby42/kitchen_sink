import type { Metadata } from "next";
import { Suspense } from "react";
import { FindFilters } from "@/components/search/FindFilters";
import { TherapistCard } from "@/components/search/TherapistCard";
import { parseFindSearchParams, searchTherapists } from "@/lib/search/rpc";
import { MAYA_ID } from "@/lib/therapists/ids";

export const metadata: Metadata = {
  title: "Find a therapist",
};

type FindPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FindPage({ searchParams }: FindPageProps) {
  const filters = parseFindSearchParams(await searchParams);
  const rows = await searchTherapists(filters);
  const showSampleNote = rows?.some((row) => row.profile_id === MAYA_ID);

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
            {showSampleNote ? (
              <p className="rounded-full bg-clay/10 px-5 py-3 text-sm text-mute">
                Kitchen Sink just launched, so you&apos;re seeing a sample
                profile marked SAMPLE below to show what&apos;s possible. Real
                founding therapists will appear here as they join.
              </p>
            ) : null}
            <p className="text-sm text-mute">
              {rows.length} therapist{rows.length === 1 ? "" : "s"}
            </p>
            <ul className="space-y-4">
              {rows.map((row) => (
                <li key={row.profile_id}>
                  <TherapistCard row={row} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
