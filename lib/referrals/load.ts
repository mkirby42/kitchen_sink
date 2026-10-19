import type { SupabaseClient } from "@supabase/supabase-js";
import type { ReferralViewer } from "@/lib/referrals/match";
import {
  referralError,
  toBoardPost,
  toMinePost,
  toOwnedPost,
  toQueuePost,
  toRosterTherapist,
  type BoardPost,
  type MinePost,
  type OwnedPost,
  type QueuePost,
  type RosterTherapist,
} from "@/lib/referrals/rows";
import { createClient } from "@/lib/supabase/server";

type LoadResult<T> = { rows: T[]; error: string | null };

function rowsOf(data: unknown) {
  return Array.isArray(data) ? data : [];
}

async function rpc(
  supabase: SupabaseClient,
  fn: string,
  args?: Record<string, unknown>,
) {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) return { data: null, error: referralError(error) };
  return { data, error: null as string | null };
}

export async function loadReferralBoard(): Promise<LoadResult<BoardPost>> {
  const supabase = await createClient();
  const { data, error } = await rpc(supabase, "referral_board");
  if (error) return { rows: [], error };
  const rows = rowsOf(data)
    .map((row) => toBoardPost(row as Record<string, unknown>))
    .filter((row): row is BoardPost => row !== null);
  return { rows, error: null };
}

export async function loadMyReferrals(): Promise<LoadResult<MinePost>> {
  const supabase = await createClient();
  const { data, error } = await rpc(supabase, "my_referrals");
  if (error) return { rows: [], error };
  const rows = rowsOf(data)
    .map((row) => toMinePost(row as Record<string, unknown>))
    .filter((row): row is MinePost => row !== null);
  return { rows, error: null };
}

export async function loadOwnedReferral(
  id: string,
): Promise<{ post: OwnedPost | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await rpc(supabase, "referral_for_poster", { p_id: id });
  if (error) return { post: null, error };
  const post =
    rowsOf(data)
      .map((row) => toOwnedPost(row as Record<string, unknown>))
      .find((row): row is OwnedPost => row !== null) ?? null;
  return { post, error: null };
}

export async function loadInterestRoster(
  postId: string,
): Promise<LoadResult<RosterTherapist>> {
  const supabase = await createClient();
  const { data, error } = await rpc(supabase, "referral_interest_roster", {
    p_post_id: postId,
  });
  if (error) return { rows: [], error };
  const rows = rowsOf(data)
    .map((row) => toRosterTherapist(row as Record<string, unknown>))
    .filter((row): row is RosterTherapist => row !== null);
  return { rows, error: null };
}

export async function loadAdminReferralQueue(): Promise<LoadResult<QueuePost>> {
  const supabase = await createClient();
  const { data, error } = await rpc(supabase, "admin_referral_queue");
  if (error) return { rows: [], error };
  const rows = rowsOf(data)
    .map((row) => toQueuePost(row as Record<string, unknown>))
    .filter((row): row is QueuePost => row !== null);
  return { rows, error: null };
}

export async function loadReferralViewer(userId: string): Promise<ReferralViewer> {
  const supabase = await createClient();
  const [tags, therapist] = await Promise.all([
    supabase
      .from("tags")
      .select("kind, label")
      .eq("profile_id", userId)
      .in("kind", ["specialty", "insurance"]),
    supabase
      .from("therapists")
      .select("virtual_practice, in_person_practice, sliding_scale")
      .eq("profile_id", userId)
      .maybeSingle(),
  ]);

  const specialtyLabels: string[] = [];
  const insuranceLabels: string[] = [];
  for (const tag of tags.data ?? []) {
    if (!tag.label) continue;
    if (tag.kind === "specialty") specialtyLabels.push(tag.label);
    if (tag.kind === "insurance") insuranceLabels.push(tag.label);
  }

  return {
    specialtyLabels,
    insuranceLabels,
    virtual: therapist.data?.virtual_practice === true,
    inPerson: therapist.data?.in_person_practice === true,
    slidingScale: therapist.data?.sliding_scale === true,
  };
}

export async function loadShareProfiles(ids: string[]) {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const [profiles, therapists, tags] = await Promise.all([
    supabase.from("profiles").select("id, name").in("id", ids),
    supabase
      .from("therapists")
      .select(
        "profile_id, credential, virtual_practice, in_person_practice, sliding_scale, listed, published, open_to_new_clients",
      )
      .in("profile_id", ids),
    supabase
      .from("tags")
      .select("profile_id, kind, label")
      .in("profile_id", ids)
      .in("kind", ["specialty", "insurance"]),
  ]);

  const names = new Map(
    (profiles.data ?? []).map((row) => [row.id as string, (row.name as string) ?? ""]),
  );
  const practice = new Map(
    (therapists.data ?? []).map((row) => [row.profile_id as string, row]),
  );
  const specialties = new Map<string, string[]>();
  const insurance = new Map<string, string[]>();
  for (const tag of tags.data ?? []) {
    const id = tag.profile_id as string;
    const bucket = tag.kind === "insurance" ? insurance : specialties;
    const list = bucket.get(id) ?? [];
    if (tag.label) list.push(tag.label);
    bucket.set(id, list);
  }

  return ids.flatMap((id) => {
    const row = practice.get(id);
    if (!row) return [];
    if (row.published !== true || row.listed !== true || row.open_to_new_clients !== true) {
      return [];
    }
    return [
      {
        id,
        name: names.get(id)?.trim() || "Therapist",
        credential: (row.credential as string | null) ?? null,
        specialtyLabels: specialties.get(id) ?? [],
        insuranceLabels: insurance.get(id) ?? [],
        virtual: row.virtual_practice === true,
        inPerson: row.in_person_practice === true,
        slidingScale: row.sliding_scale === true,
        listed: true,
        published: true,
        openToNewClients: true,
      },
    ];
  });
}
