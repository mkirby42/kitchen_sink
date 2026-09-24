import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { JoinAuth } from "@/components/join/JoinAuth";
import { JoinWizard } from "@/components/join/JoinWizard";
import { fetchJoinDraft } from "@/lib/join/load-draft";
import { routes } from "@/lib/routes";
import { supabasePublicConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Join as a therapist",
};

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; mode?: string; edit?: string }>;
}) {
  if (!supabasePublicConfig()) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="font-display text-4xl">Join as a therapist</h1>
        <p className="mt-4 text-mute">Auth isn&apos;t configured yet.</p>
      </main>
    );
  }

  const params = await searchParams;
  const editing = params.edit === "1";
  const initialMode =
    params.mode === "signin" || editing ? "signin" : "signup";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <JoinAuth initialMode={initialMode} />;

  const { data: therapist } = await supabase
    .from("therapists")
    .select("profile_id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (therapist && !editing) redirect(routes.therapist(user.id));

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "admin") redirect(routes.adminMedia);

  if (profile?.role === "patient") {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <section className="rounded-[2rem] bg-paper px-6 py-10 shadow-[0_24px_70px_rgba(27,39,68,0.12)]">
          <p className="text-xs font-semibold tracking-[0.2em] text-clay uppercase">
            Patient account
          </p>
          <h1 className="mt-3 font-display text-4xl tracking-tight">
            You&apos;re signed in as a patient.
          </h1>
          <p className="mt-4 text-mute">
            Keep browsing therapists on Kitchen Sink. Sign out if you want to
            join as a therapist.
          </p>
          <Link
            href={routes.find}
            className="mt-8 inline-flex rounded-full bg-clay px-5 py-3 font-medium text-paper hover:bg-clay-dark"
          >
            Find a therapist
          </Link>
        </section>
      </main>
    );
  }

  const rawStep = Number(params.step);
  const initialStep =
    Number.isInteger(rawStep) && rawStep >= 1 && rawStep <= 4
      ? (rawStep as 1 | 2 | 3 | 4)
      : 1;

  const loadedDraft =
    therapist && editing
      ? await fetchJoinDraft(supabase, user.id, user.email ?? "")
      : undefined;

  if (editing && !loadedDraft) redirect(routes.join);

  return (
    <JoinWizard
      userId={user.id}
      email={user.email ?? ""}
      initialStep={initialStep}
      initialDraft={loadedDraft ?? undefined}
      editing={Boolean(loadedDraft)}
    />
  );
}
