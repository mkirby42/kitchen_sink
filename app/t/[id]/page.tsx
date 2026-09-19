import type { Metadata } from "next";
import {
  ProfileNotFound,
  TherapistProfile,
} from "@/components/profile/TherapistProfile";
import { loadTherapistProfile } from "@/lib/therapists/load";

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

  return <TherapistProfile data={data} />;
}
