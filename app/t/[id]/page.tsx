import type { Metadata } from "next";
import { buildFindHref } from "@/components/search/query";
import {
  ProfileNotFound,
  TherapistProfile,
} from "@/components/profile/TherapistProfile";
import { loadReviewViewer, type ReviewViewer } from "@/lib/reviews/viewer";
import { parseFindSearchParams } from "@/lib/search/rpc";
import { supabasePublicConfig } from "@/lib/supabase/env";
import { therapistMetaDescription } from "@/lib/site";
import { loadTherapistProfile } from "@/lib/therapists/load";

const emptyViewer: ReviewViewer = {
  userId: null,
  role: null,
  isOwner: false,
};

async function loadViewer(therapistId: string): Promise<ReviewViewer> {
  if (!supabasePublicConfig()) return emptyViewer;
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    return await loadReviewViewer(supabase, therapistId);
  } catch {
    return emptyViewer;
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

  const viewer = await loadViewer(data.id);

  return <TherapistProfile data={data} backHref={backHref} viewer={viewer} />;
}
