import type { Metadata } from "next";
import Link from "next/link";
import { InboxAuth } from "@/components/matches/InboxAuth";
import { InterestInbox } from "@/components/matches/InterestInbox";
import { loadInterestInbox } from "@/lib/interest/viewer";
import { routes } from "@/lib/routes";
import { supabasePublicConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Interest",
};

function TherapistOnlyCard({ offerJoin }: { offerJoin: boolean }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="rounded-3xl border border-line bg-paper p-8">
        <p className="font-display text-2xl tracking-tight">
          This inbox is for therapists.
        </p>
        <p className="mt-3 text-mute">
          <Link href={routes.find} className="text-clay hover:text-clay-dark">
            Find a Therapist
          </Link>
          {offerJoin ? (
            <>
              {" "}
              or{" "}
              <Link href={routes.join} className="text-clay hover:text-clay-dark">
                Join as a Therapist
              </Link>
            </>
          ) : null}
          .
        </p>
      </div>
    </main>
  );
}

export default async function MatchesPage() {
  if (!supabasePublicConfig()) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="font-display text-4xl">Interest</h1>
        <p className="mt-4 text-mute">Auth isn&apos;t configured yet.</p>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <InboxAuth />;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "patient") {
    return <TherapistOnlyCard offerJoin={false} />;
  }

  if (profile?.role !== "therapist") {
    return <TherapistOnlyCard offerJoin={true} />;
  }

  let rows;
  try {
    rows = await loadInterestInbox(supabase);
  } catch {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="rounded-3xl border border-line bg-paper px-6 py-10 text-center text-mute">
          Interest isn&apos;t available right now.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <InterestInbox rows={rows} />
    </main>
  );
}
