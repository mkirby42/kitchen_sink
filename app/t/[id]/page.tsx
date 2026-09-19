import type { Metadata } from "next";
import { buildFindHref } from "@/components/search/query";
import {
  ProfileNotFound,
  TherapistProfile,
} from "@/components/profile/TherapistProfile";
import { parseFindSearchParams } from "@/lib/search/rpc";
import { loadTherapistProfile } from "@/lib/therapists/load";

type ProfilePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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
  searchParams,
}: ProfilePageProps) {
  const { id } = await params;
  const backHref = buildFindHref(parseFindSearchParams(await searchParams));
  const data = await loadTherapistProfile(id);

  if (!data) return <ProfileNotFound backHref={backHref} />;

  return <TherapistProfile data={data} backHref={backHref} />;
}
