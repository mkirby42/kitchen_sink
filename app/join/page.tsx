import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { JoinAuth } from "@/components/join/JoinAuth";
import { JoinWizard } from "@/components/join/JoinWizard";
import { routes } from "@/lib/routes";
import { supabasePublicConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Join as a therapist",
};

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  if (!supabasePublicConfig()) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="font-display text-4xl">Join as a therapist</h1>
        <p className="mt-4 text-mute">Auth isn&apos;t configured yet.</p>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <JoinAuth />;

  const { data: therapist } = await supabase
    .from("therapists")
    .select("profile_id")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (therapist) redirect(routes.therapist(user.id));

  const rawStep = Number((await searchParams).step);
  const initialStep =
    Number.isInteger(rawStep) && rawStep >= 1 && rawStep <= 4
      ? (rawStep as 1 | 2 | 3 | 4)
      : 1;

  return (
    <JoinWizard
      userId={user.id}
      email={user.email ?? ""}
      initialStep={initialStep}
    />
  );
}
