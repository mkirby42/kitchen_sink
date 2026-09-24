import type { Metadata } from "next";
import { buildFindHref } from "@/components/search/query";
import {
  ProfileNotFound,
  TherapistProfile,
} from "@/components/profile/TherapistProfile";
import { parseFindSearchParams } from "@/lib/search/rpc";
import { supabasePublicConfig } from "@/lib/supabase/env";
import { therapistMetaDescription } from "@/lib/site";
import { loadTherapistProfile } from "@/lib/therapists/load";

async function loadIsOwner(therapistId: string): Promise<boolean> {
  if (!supabasePublicConfig()) return false;
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id === therapistId;
  } catch {
    return false;
  }
}

type ProfilePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await loadTherapistProfile(id);
  if (!data) {
    return {
      title: "Therapist not found",
      description: "That therapist profile is not available.",
      robots: { index: false, follow: true },
      alternates: { canonical: `/t/${id}` },
    };
  }
  return {
    title: data.name,
    description: therapistMetaDescription({
      name: data.name,
      credential: data.credential,
      specialties: data.specialties,
    }),
    alternates: { canonical: `/t/${data.id}` },
  };
}

export default async function TherapistProfilePage({
  params,
  searchParams,
}: ProfilePageProps) {
  const { id } = await params;
  const backHref = buildFindHref(parseFindSearchParams(await searchParams));
  const data = await loadTherapistProfile(id);

  if (!data) return <ProfileNotFound backHref={backHref} />;

  const isOwner = await loadIsOwner(data.id);

  return (
    <TherapistProfile data={data} backHref={backHref} isOwner={isOwner} />
  );
}
