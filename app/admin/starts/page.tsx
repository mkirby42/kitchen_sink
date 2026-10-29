import type { Metadata } from "next";
import { AccountShell } from "@/components/auth/AccountShell";
import { AdminSignIn } from "@/components/admin/AdminSignIn";
import { routes } from "@/lib/routes";
import { AdminViewHold } from "@/components/admin/AdminViewHold";
import {
  ProfileStartQueue,
  type ProfileStartItem,
} from "@/components/admin/ProfileStartQueue";
import { adminToolsVisible } from "@/lib/audience";
import { readAudienceCookie } from "@/lib/audience-cookie";
import { supabasePublicConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Profile drafts",
  robots: { index: false, follow: false },
  alternates: { canonical: "/admin/starts" },
};

const statuses = new Set(["submitted", "drafting", "ready", "published"]);

export default async function AdminStartsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!supabasePublicConfig()) {
    return (
      <AccountShell
        eyebrow="Ops"
        title="Profile drafts"
        lede="Auth isn't configured yet."
      />
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <AdminSignIn
        returnPath={routes.adminStarts}
        searchParams={searchParams}
        title="Sign in to profile drafts"
        lede="This page is for Kitchen Sink ops. Start a hidden draft from a therapist's request, then email them when it is ready."
      />
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !adminToolsVisible({
      role: profile?.role,
      audience: await readAudienceCookie(),
    })
  ) {
    if (profile?.role === "admin") return <AdminViewHold />;
    return (
      <AccountShell
        eyebrow="Ops"
        title="Admin access only"
        lede="This page is for Kitchen Sink ops."
      />
    );
  }

  const { data, error } = await supabase
    .from("profile_starts")
    .select("id, name, email, links, status, profile_id, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return (
      <AccountShell
        eyebrow="Ops"
        title="Profile drafts"
        lede="The request list isn't available yet. Apply the profile starts migration, then reload."
      />
    );
  }

  const requests: ProfileStartItem[] = (data ?? []).flatMap((row) => {
    if (!statuses.has(row.status)) return [];
    const links = Array.isArray(row.links)
      ? row.links.filter((link): link is string => typeof link === "string")
      : [];
    return [
      {
        id: row.id,
        name: row.name,
        email: row.email,
        links,
        status: row.status as ProfileStartItem["status"],
        profileId: row.profile_id,
        createdAt: row.created_at,
      },
    ];
  });

  return <ProfileStartQueue requests={requests} />;
}
