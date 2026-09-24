import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminTherapist = {
  id: string;
  name: string;
  email: string | null;
  credential: string | null;
  openToNewClients: boolean;
  photoKey: string | null;
  videoKey: string | null;
};

type PracticeRow = {
  credential: string | null;
  open_to_new_clients: boolean;
};

export type TherapistMediaRow = {
  id: string;
  name: string;
  email: string | null;
  photo_key: string | null;
  video_key: string | null;
  therapists: PracticeRow | PracticeRow[] | null;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isTherapistMediaKey(therapistId: string, key: string) {
  if (!UUID_RE.test(therapistId)) return false;
  const prefix = `${therapistId}/`;
  if (!key.startsWith(prefix)) return false;
  const rest = key.slice(prefix.length);
  if (!rest || rest.includes("/") || rest.includes("\\") || rest.includes("..")) {
    return false;
  }
  return true;
}

export function filterTherapists(rows: AdminTherapist[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) => {
    const email = row.email?.toLowerCase() ?? "";
    return row.name.toLowerCase().includes(needle) || email.includes(needle);
  });
}

export function normalizeAdminTherapists(rows: TherapistMediaRow[]) {
  const therapists: AdminTherapist[] = [];
  for (const row of rows) {
    const practice = Array.isArray(row.therapists)
      ? row.therapists[0]
      : row.therapists;
    if (!practice) continue;
    therapists.push({
      id: row.id,
      name: row.name,
      email: row.email,
      credential: practice.credential,
      openToNewClients: practice.open_to_new_clients,
      photoKey: row.photo_key,
      videoKey: row.video_key,
    });
  }
  return therapists.sort((a, b) => a.name.localeCompare(b.name));
}

export async function listAdminTherapists(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, name, email, photo_key, video_key, therapists!inner(credential, open_to_new_clients)",
    )
    .eq("role", "therapist")
    .order("name");

  if (error) throw error;
  return normalizeAdminTherapists((data ?? []) as TherapistMediaRow[]);
}
