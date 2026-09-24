import type { Metadata } from "next";
import { AdminAuth } from "@/components/admin/AdminAuth";
import { HelperUpload } from "@/components/admin/HelperUpload";
import { listAdminTherapists } from "@/lib/admin/media";
import { supabasePublicConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Upload media",
};

export default async function AdminMediaPage() {
  if (!supabasePublicConfig()) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="font-display text-4xl">Upload media</h1>
        <p className="mt-4 text-mute">Auth isn&apos;t configured yet.</p>
      </main>
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

  if (profile?.role !== "admin") {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <p className="text-xs font-semibold tracking-[0.2em] text-clay uppercase">
          Ops
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight">
          Admin access only
        </h1>
        <p className="mt-4 text-mute">
          This upload page is for Kitchen Sink ops. A therapist or patient
          login cannot upload media for someone else.
        </p>
      </main>
    );
  }

  let therapists;
  try {
    therapists = await listAdminTherapists(supabase);
  } catch {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <h1 className="font-display text-4xl">Upload media</h1>
        <p className="mt-4 text-mute">Therapist list isn&apos;t available right now.</p>
      </main>
    );
  }

  return <HelperUpload therapists={therapists} />;
}
