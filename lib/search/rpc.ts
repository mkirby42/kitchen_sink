import { createClient } from "@/lib/supabase/server";
import { supabasePublicConfig } from "@/lib/supabase/env";
import { allowedLicenseState, allowedSearchTags } from "@/lib/tags/presets";

export type SearchRow = {
  profile_id: string;
  name: string;
  photo_key: string | null;
  credential: string | null;
  start_date_of_practice: string | null;
  min_price_cents: number | null;
  min_duration_minutes: number | null;
  virtual_practice: boolean;
  in_person_practice: boolean;
  specialty_labels: string[];
  insurance_labels: string[];
  match_count: number;
  matched_labels: string[];
  sliding_scale: boolean;
  /** False when an admin search included an unlisted profile. Absent means listed. */
  listed?: boolean;
  video_key: string | null;
  card_prompt: string | null;
  card_answer: string | null;
  card_tag: string | null;
};

export type SearchFilters = {
  tags: string[];
  virtual: boolean;
  inPerson: boolean;
  state: string | null;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function splitTags(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value.join(",") : (value ?? "");
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function parseFindSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): SearchFilters {
  return {
    tags: allowedSearchTags(splitTags(searchParams.tags)),
    virtual: first(searchParams.virtual) === "1",
    inPerson: first(searchParams.in_person) === "1",
    state: allowedLicenseState(first(searchParams.state)),
  };
}

export function searchRpcArgs(filters: SearchFilters) {
  return {
    p_tags: allowedSearchTags(filters.tags),
    p_virtual: filters.virtual,
    p_in_person: filters.inPerson,
    p_state: allowedLicenseState(filters.state),
    p_limit: 24,
    p_offset: 0,
  };
}

export async function searchTherapists(filters: SearchFilters) {
  if (!supabasePublicConfig()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "search_therapists",
    searchRpcArgs(filters),
  );
  if (error) throw error;
  return (data ?? []) as SearchRow[];
}
