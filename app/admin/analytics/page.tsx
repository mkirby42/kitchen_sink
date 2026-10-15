import type { Metadata } from "next";
import { AccountShell } from "@/components/auth/AccountShell";
import { AdminAuth } from "@/components/admin/AdminAuth";
import { AdminViewHold } from "@/components/admin/AdminViewHold";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import {
  analyticsLoadError,
  analyticsWindow,
  loadAnalytics,
} from "@/lib/admin/analytics";
import { adminToolsVisible } from "@/lib/audience";
import { readAudienceCookie } from "@/lib/audience-cookie";
import { supabasePublicConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Analytics",
  robots: { index: false, follow: false },
  alternates: { canonical: "/admin/analytics" },
};

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string | string[] }>;
}) {
  if (!supabasePublicConfig()) {
    return (
      <AccountShell
        eyebrow="Ops"
        title="Analytics"
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
      <AdminAuth
        title="Sign in to see analytics"
        lede="This page is for Kitchen Sink ops. Visit and click counts stay here."
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
        lede="This page is for Kitchen Sink ops. A therapist or patient login cannot see site analytics."
      />
    );
  }

  const days = analyticsWindow((await searchParams).days);
  let data;
  let loadError = "";
  try {
    data = await loadAnalytics(supabase, days);
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : undefined;
    const message = error instanceof Error ? error.message : "";
    loadError = analyticsLoadError({ code, message });
  }

  if (!data) {
    return (
      <AccountShell eyebrow="Ops" title="Analytics" lede={loadError} />
    );
  }

  return <AnalyticsDashboard data={data} />;
}
