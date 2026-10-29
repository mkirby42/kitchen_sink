import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountShell } from "@/components/auth/AccountShell";
import { SignOutForm } from "@/components/auth/SignOutForm";
import { AdminViewHold } from "@/components/admin/AdminViewHold";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { buttonClass } from "@/components/ui/styles";
import { JoinAuth } from "@/components/join/JoinAuth";
import { readAuthQuery } from "@/lib/auth/auth-query";
import { joinModeHref } from "@/lib/join/mode-href";
import { JoinWizard } from "@/components/join/JoinWizard";
import { readAudienceCookie } from "@/lib/audience-cookie";
import { adminToolsVisible } from "@/lib/audience";
import { ADMIN_JOIN_NOTICE, editSubject, joinAccess } from "@/lib/join/access";
import { fetchJoinEditor } from "@/lib/join/load-draft";
import { isProfileId } from "@/lib/join/publish";
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

const STARTED_DRAFT_NOTICE =
  "You're filling this draft in for them. It stays off Find and the public profile until they publish it.";

function one(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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
  const flash = readAuthQuery(params);
  const editing = one(params.edit) === "1";
  const profileIdParam = one(params.profile).trim();
  const targetProfileId = editing ? profileIdParam : "";
  const forRaw = one(params.for);
  const forId = forRaw && isProfileId(forRaw) ? forRaw : null;
  const modeParam = one(params.mode);
  const initialMode =
    editing || modeParam === "signin" ? "signin" : "signup";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <JoinAuth
        initialMode={initialMode}
        initialEmail={flash.email}
        initialError={flash.error}
        initialSent={flash.sent}
        signUpHref={joinModeHref("signup", params)}
        signInHref={joinModeHref("signin", params)}
      />
    );
  }

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
    profile: profileIdParam,
  });

  if (subject.kind === "deny") redirect(routes.find);

  const rawStep = Number(one(params.step));
  const initialStep =
    Number.isInteger(rawStep) && rawStep >= 1 && rawStep <= 4
      ? (rawStep as 1 | 2 | 3 | 4)
      : 1;

  if (subject.kind === "other") {
    const loaded = await fetchJoinEditor(supabase, subject.id, "");
    if (!loaded) redirect(routes.therapist(subject.id));
    const started = await hasUnpublishedStart(supabase, subject.id);
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
        publishHeld={started}
        notice={flash.error || (started ? STARTED_DRAFT_NOTICE : undefined)}
      />
    );
  }

  const access = joinAccess({
    userId: user.id,
    role,
    hasTherapist: Boolean(therapist),
    editing,
    targetProfileId,
    forId,
  });

  if (access.kind === "wizard" && access.onBehalfId) {
    if (
      !adminToolsVisible({
        role,
        audience: await readAudienceCookie(),
      })
    ) {
      return <AdminViewHold />;
    }
  }

  if (
    access.kind === "redirect" &&
    role === "therapist" &&
    (await hasUnpublishedStart(supabase, user.id))
  ) {
    redirect(routes.joinEdit);
  }

  if (access.kind === "redirect") redirect(access.href);

  if (access.kind === "patient") {
    return (
      <AccountShell
        eyebrow="Patient account"
        title="You're signed in as a patient."
        lede="Keep browsing therapists on Kitchen Sink. Sign out if you want to join as a therapist."
      >
        {flash.error ? <Notice role="alert">{flash.error}</Notice> : null}
        <div className="flex flex-wrap justify-center gap-3">
          <Button href={routes.find}>Find a therapist</Button>
          <SignOutForm className={buttonClass("secondary")} />
        </div>
      </AccountShell>
    );
  }

  const profileId = access.onBehalfId ?? access.profileId ?? user.id;
  const loaded = access.editing
    ? await fetchJoinEditor(
        supabase,
        profileId,
        access.onBehalfId ? "" : (user.email ?? ""),
      )
    : null;

  if (access.editing && !loaded) {
    if (access.onBehalfId) {
      return (
        <AccountShell
          eyebrow="Ops"
          title="No profile to edit"
          lede="That account does not have a therapist profile yet."
        />
      );
    }
    redirect(access.profileId ? routes.adminMedia : routes.join);
  }

  const practice = therapist as { published?: boolean | null } | null;
  const published = access.editing
    ? (loaded?.published ?? true)
    : practice
      ? isProfilePublished(practice.published)
      : false;
  const started = access.editing
    ? await hasUnpublishedStart(supabase, profileId)
    : false;
  const canPublish = started && !access.onBehalfId;
  const audience = await readAudienceCookie();

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
      onBehalfId={access.onBehalfId}
      canPublish={canPublish}
      publishHeld={Boolean(access.onBehalfId) && started}
      notice={
        flash.error
          ? flash.error
          : access.onBehalfId
            ? STARTED_DRAFT_NOTICE
            : canPublish
              ? "This draft is only visible to you and Kitchen Sink. Nothing goes live until you publish it."
              : access.adminTest && !access.editing && audience === "admin"
                ? ADMIN_JOIN_NOTICE
                : undefined
      }
    />
  );
}

async function hasUnpublishedStart(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("profile_starts")
    .select("id")
    .eq("profile_id", userId)
    .in("status", ["drafting", "ready"])
    .limit(1);
  if (error || !data) return false;
  return data.length > 0;
}
