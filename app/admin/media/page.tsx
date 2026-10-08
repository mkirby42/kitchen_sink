import type { Metadata } from "next";
import { AccountShell } from "@/components/auth/AccountShell";
import { AdminAuth } from "@/components/admin/AdminAuth";
import { AdminViewHold } from "@/components/admin/AdminViewHold";
import { HelperUpload } from "@/components/admin/HelperUpload";
import { adminToolsVisible } from "@/lib/audience";
import { readAudienceCookie } from "@/lib/audience-cookie";
import { listAdminTherapists } from "@/lib/admin/media";
import { supabasePublicConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Upload media",
  robots: { index: false, follow: false },
  alternates: { canonical: "/admin/media" },
};

export default async function AdminMediaPage() {
  if (!supabasePublicConfig()) {
    return (
      <AccountShell
        eyebrow="Ops"
        title="Upload media"
        lede="Auth isn't configured yet."
      />
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <AdminAuth />;

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
        lede="This upload page is for Kitchen Sink ops. A therapist or patient login cannot upload media for someone else."
      />
    );
  }

  let therapists;
  try {
    therapists = await listAdminTherapists(supabase);
  } catch {
    return (
      <AccountShell
        eyebrow="Ops"
        title="Upload media"
        lede="Therapist list isn't available right now."
      />
    );
  }

  return <HelperUpload therapists={therapists} />;
}
