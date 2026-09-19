import type { Metadata } from "next";
import {
  ProfileNotFound,
  TherapistProfile,
} from "@/components/profile/TherapistProfile";
import { loadInterestViewer, type InterestViewer } from "@/lib/interest/viewer";
import { supabasePublicConfig } from "@/lib/supabase/env";
import { loadTherapistProfile } from "@/lib/therapists/load";

const emptyViewer: InterestViewer = {
  userId: null,
  role: null,
  interested: false,
  isOwner: false,
};

async function loadViewer(therapistId: string): Promise<InterestViewer> {
  if (!supabasePublicConfig()) return emptyViewer;
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    return await loadInterestViewer(supabase, therapistId);
  } catch {
    return emptyViewer;
  }
}

type ProfilePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await loadTherapistProfile(id);
  if (!data) return { title: "Therapist not found" };
  return { title: data.name };
}

export default async function TherapistProfilePage({
  params,
}: ProfilePageProps) {
  const { id } = await params;
  const data = await loadTherapistProfile(id);

  if (!data) return <ProfileNotFound />;

  const viewer = await loadViewer(data.id);

  return <TherapistProfile data={data} viewer={viewer} />;
}
