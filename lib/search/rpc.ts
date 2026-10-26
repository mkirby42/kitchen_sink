import { applyFindOtherMatches } from "@/lib/search/find-other";
import { createClient } from "@/lib/supabase/server";
import { supabasePublicConfig } from "@/lib/supabase/env";
import {
  allowedLicenseState,
  allowedSearchTags,
  canonicalSpecialtyLabels,
  isFindOtherMarker,
  searchQueryTags,
} from "@/lib/tags/presets";

/** Public Find page. Other uses a larger cohort so post-filtering is not the first page. */
const FIND_PAGE_LIMIT = 24;
const FIND_OTHER_RPC_LIMIT = 500;

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
  /** False when an admin search included a draft. Absent means published. */
  published?: boolean;
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
  const otherSelected = filters.tags.some((tag) => isFindOtherMarker(tag));
  return {
    p_tags: searchQueryTags(filters.tags),
    p_virtual: filters.virtual,
    p_in_person: filters.inPerson,
    p_state: allowedLicenseState(filters.state),
    p_limit: otherSelected ? FIND_OTHER_RPC_LIMIT : FIND_PAGE_LIMIT,
    p_offset: 0,
  };
}

export function normalizeSearchRows(rows: SearchRow[], selected: string[]) {
  const selectedSet = new Set(allowedSearchTags(selected));
  let countsChanged = false;
  const mapped = rows.map((row) => {
    const specialty_labels = canonicalSpecialtyLabels(
      row.specialty_labels ?? [],
    );
    const matched_labels = canonicalSpecialtyLabels(row.matched_labels ?? []);
    const match_count = matched_labels.filter((label) =>
      selectedSet.has(label),
    ).length;
    if (match_count !== row.match_count) countsChanged = true;
    return { ...row, specialty_labels, matched_labels, match_count };
  });
  if (!countsChanged) return mapped;
  return mapped.sort((a, b) => {
    if (b.match_count !== a.match_count) return b.match_count - a.match_count;
    return a.name.localeCompare(b.name);
  });
}

export async function searchTherapists(filters: SearchFilters) {
  if (!supabasePublicConfig()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "search_therapists",
    searchRpcArgs(filters),
  );
  if (error) throw error;
  return applyFindOtherMatches(
    normalizeSearchRows((data ?? []) as SearchRow[], filters.tags),
    filters.tags,
  );
}
