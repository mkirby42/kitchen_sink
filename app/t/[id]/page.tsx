import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthQueryProvider } from "@/components/auth/AuthQuery";
import { readAuthQuery } from "@/lib/auth/auth-query";
import {
  buildFindHref,
  buildTherapistHref,
  requestFindHref,
} from "@/components/search/query";
import { routes } from "@/lib/routes";
import { TrackProfileView } from "@/components/analytics/TrackProfileView";
import {
  ProfileNotFound,
  TherapistProfile,
} from "@/components/profile/TherapistProfile";
import { narrowSearchRows, presentProfileData, presentReviewViewer } from "@/lib/audience";
import { profileManageForViewer } from "@/lib/profile/manage";
import { readAudienceCookie } from "@/lib/audience-cookie";
import { loadReviewViewer, type ReviewViewer } from "@/lib/reviews/viewer";
import { matchSlot } from "@/lib/search/phone-find";
import { parseFindSearchParams, searchTherapists } from "@/lib/search/rpc";
import type { PhoneProfileBrowse } from "@/components/profile/PhoneProfileSwipe";
import { supabasePublicConfig } from "@/lib/supabase/env";
import { therapistMetaDescription } from "@/lib/site";
import { loadTherapistProfile } from "@/lib/therapists/load";

export const dynamic = "force-dynamic";

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
  const audience = await readAudienceCookie();
  const data = await loadTherapistProfile(id, audience);
  if (!data) {
    return {
      title: "Therapist not found",
      description: "That therapist profile is not available.",
      robots: { index: false, follow: true },
      alternates: { canonical: `/t/${id}` },
    };
  }
  if (data.hiddenFromPublic || data.unpublished) {
    return {
      title: data.name,
      description: therapistMetaDescription({
        name: data.name,
        credential: data.credential,
        specialties: data.specialties,
      }),
      robots: { index: false, follow: false },
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
  const raw = await searchParams;
  const filters = parseFindSearchParams(raw);
  const backHref = buildFindHref(filters);
  const cleanProfile = buildTherapistHref(id, filters);
  const requestedProfile = requestFindHref(raw).replace(
    routes.find,
    routes.therapist(id),
  );
  if (requestedProfile !== cleanProfile) redirect(cleanProfile);
  const audience = await readAudienceCookie();
  const [data, found] = await Promise.all([
    loadTherapistProfile(id, audience),
    searchTherapists(filters).catch(() => null),
  ]);

  if (!data) return <ProfileNotFound backHref={backHref} />;

  const viewer = await loadViewer(data.id);
  const matches = found
    ? narrowSearchRows(found, {
        roleIsAdmin: viewer.role === "admin",
        audience,
      })
    : null;
  const browse = phoneProfileBrowse(matches, data.id, filters, backHref);

  return (
    <AuthQueryProvider value={readAuthQuery(raw)}>
      <TrackProfileView therapistId={data.id} />
      <TherapistProfile
        data={presentProfileData(data, viewer.role, audience)}
        backHref={backHref}
        browse={browse}
        viewer={presentReviewViewer(viewer, audience)}
        manage={profileManageForViewer({
          viewer,
          audience,
          profileId: data.id,
        })}
      />
    </AuthQueryProvider>
  );
}

function phoneProfileBrowse(
  rows: Awaited<ReturnType<typeof searchTherapists>>,
  id: string,
  filters: ReturnType<typeof parseFindSearchParams>,
  allHref: string,
): PhoneProfileBrowse | null {
  if (!rows) return null;
  const slot = matchSlot(
    rows.map((row) => row.profile_id),
    id,
  );
  if (!slot) return null;
  const next = slot.nextIndex == null ? null : rows[slot.nextIndex];
  const prev = slot.prevIndex == null ? null : rows[slot.prevIndex];
  return {
    index: slot.index,
    count: slot.count,
    allHref,
    prevHref: prev ? buildTherapistHref(prev.profile_id, filters) : null,
    nextHref: next ? buildTherapistHref(next.profile_id, filters) : null,
    nextName: next?.name ?? null,
    nextCredential: next?.credential ?? null,
    nextAnswer: next?.card_answer?.trim() || null,
  };
}
