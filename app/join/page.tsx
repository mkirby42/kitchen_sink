import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountShell } from "@/components/auth/AccountShell";
import { Button } from "@/components/ui/Button";
import { JoinAuth } from "@/components/join/JoinAuth";
import { JoinWizard } from "@/components/join/JoinWizard";
import { readAudienceCookie } from "@/lib/audience-cookie";
import { ADMIN_JOIN_NOTICE, joinAccess } from "@/lib/join/access";
import { fetchJoinDraft } from "@/lib/join/load-draft";
import { parseProfileRole } from "@/lib/role";
import { routes } from "@/lib/routes";
import { supabasePublicConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Join as a therapist",
  description:
    "Publish a therapist profile with a photo, credentials, rates, and contact info.",
  alternates: { canonical: "/join" },
};

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; mode?: string; edit?: string }>;
}) {
  if (!supabasePublicConfig()) {
    return (
      <AccountShell
        eyebrow="Join as a therapist"
        title="Join as a therapist"
        lede="Auth isn't configured yet."
      />
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const access = joinAccess({
    userId: user.id,
    role: parseProfileRole(profile?.role),
    hasTherapist: Boolean(therapist),
    editing,
  });

  if (access.kind === "redirect") redirect(access.href);

  if (access.kind === "patient") {
    return (
      <AccountShell
        eyebrow="Patient account"
        title="You're signed in as a patient."
        lede="Keep browsing therapists on Kitchen Sink. Sign out if you want to join as a therapist."
      >
        <div className="flex justify-center">
          <Button href={routes.find}>Find a therapist</Button>
        </div>
      </AccountShell>
    );
  }

  const rawStep = Number(params.step);
  const initialStep =
    Number.isInteger(rawStep) && rawStep >= 1 && rawStep <= 4
      ? (rawStep as 1 | 2 | 3 | 4)
      : 1;

  const loadedDraft = access.editing
    ? await fetchJoinDraft(supabase, user.id, user.email ?? "")
    : undefined;

  if (access.editing && !loadedDraft) redirect(routes.join);

  return (
    <JoinWizard
      userId={user.id}
      email={user.email ?? ""}
      initialStep={initialStep}
      initialDraft={loadedDraft ?? undefined}
      editing={access.editing}
      adminTest={access.adminTest}
      notice={
        access.adminTest &&
        !access.editing &&
        (await readAudienceCookie()) === "admin"
          ? ADMIN_JOIN_NOTICE
          : undefined
      }
    />
  );
}
