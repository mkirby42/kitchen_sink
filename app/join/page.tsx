import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountShell } from "@/components/auth/AccountShell";
import { Button } from "@/components/ui/Button";
import { JoinAuth } from "@/components/join/JoinAuth";
import { JoinWizard } from "@/components/join/JoinWizard";
import { readAudienceCookie } from "@/lib/audience-cookie";
import { ADMIN_JOIN_NOTICE, editSubject, joinAccess } from "@/lib/join/access";
import { fetchJoinEditor } from "@/lib/join/load-draft";
import { isProfilePublished } from "@/lib/therapists/listing";
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
  searchParams: Promise<{
    step?: string;
    mode?: string;
    edit?: string;
    profile?: string;
  }>;
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
  const targetProfileId = editing ? (params.profile?.trim() ?? "") : "";
  const initialMode =
    params.mode === "signin" || editing ? "signin" : "signup";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <JoinAuth initialMode={initialMode} />;

  const { data: therapist } = await supabase
    .from("therapists")
    .select("*")
    .eq("profile_id", user.id)
    .maybeSingle();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = parseProfileRole(profile?.role);
  const subject = editSubject({
    userId: user.id,
    role,
    profile: params.profile,
  });

  if (subject.kind === "deny") redirect(routes.find);

  const rawStep = Number(params.step);
  const initialStep =
    Number.isInteger(rawStep) && rawStep >= 1 && rawStep <= 4
      ? (rawStep as 1 | 2 | 3 | 4)
      : 1;

  if (subject.kind === "other") {
    const loaded = await fetchJoinEditor(supabase, subject.id, "");
    if (!loaded) redirect(routes.therapist(subject.id));
    return (
      <JoinWizard
        userId={user.id}
        profileId={subject.id}
        email={loaded.draft.email || user.email || ""}
        initialStep={initialStep}
        initialDraft={loaded.draft}
        editing
        published={loaded.published}
        adminTest
      />
    );
  }

  const access = joinAccess({
    userId: user.id,
    role,
    hasTherapist: Boolean(therapist),
    editing,
    targetProfileId,
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

  const profileId = access.profileId ?? user.id;
  const loaded = access.editing
    ? await fetchJoinEditor(supabase, profileId, user.email ?? "")
    : null;

  if (access.editing && !loaded) {
    redirect(access.profileId ? routes.adminMedia : routes.join);
  }

  const practice = therapist as { published?: boolean | null } | null;
  const published = access.editing
    ? (loaded?.published ?? true)
    : practice
      ? isProfilePublished(practice.published)
      : false;

  return (
    <JoinWizard
      userId={user.id}
      profileId={profileId}
      email={loaded?.draft.email || user.email || ""}
      initialStep={initialStep}
      initialDraft={loaded?.draft}
      editing={access.editing}
      published={published}
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
