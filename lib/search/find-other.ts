import {
  FIND_INSURANCE_OTHER,
  FIND_TOPIC_OTHER,
  INSURANCE_PRESETS,
  allowedSearchTags,
  canonicalSpecialtyLabels,
  isFindOtherMarker,
} from "@/lib/tags/presets";
import { isFindTopicSpecialty } from "@/lib/tags/plain-language";

const INSURANCE = new Set<string>(INSURANCE_PRESETS);

export type FindOtherRow = {
  name: string;
  specialty_labels: readonly string[];
  insurance_labels: readonly string[];
  match_count: number;
  matched_labels: string[];
  /** Absent means published. Drafts stay ahead of live rows, matching the RPC. */
  published?: boolean;
  /** Absent means listed. */
  listed?: boolean;
};

/** At least one insurance label outside the join presets, including literal "Other". */
export function hasUnlistedInsurance(labels: readonly string[]) {
  return labels.some((label) => {
    const next = label.trim();
    return next.length > 0 && !INSURANCE.has(next);
  });
}

/**
 * At least one specialty outside the seven Find topics.
 * Self Discovery, Immigration, a custom label, and literal "Other" count.
 * Teens is read as Self Discovery.
 */
export function hasUnlistedFindTopic(labels: readonly string[]) {
  return canonicalSpecialtyLabels(labels).some(
    (label) => label.trim().length > 0 && !isFindTopicSpecialty(label),
  );
}

function matchesNamedTag(
  specialties: ReadonlySet<string>,
  insurance: readonly string[],
  tag: string,
) {
  if (INSURANCE.has(tag)) return insurance.includes(tag);
  return specialties.has(tag);
}

/** OR across named tags and whichever Other markers are selected. */
export function therapistMatchesFindTags(
  row: Pick<FindOtherRow, "specialty_labels" | "insurance_labels">,
  tags: readonly string[],
) {
  const selected = allowedSearchTags([...tags]);
  const named = selected.filter((tag) => !isFindOtherMarker(tag));
  const insuranceOther = selected.includes(FIND_INSURANCE_OTHER);
  const topicOther = selected.includes(FIND_TOPIC_OTHER);
  if (named.length === 0 && !insuranceOther && !topicOther) return true;

  const specialties = new Set(canonicalSpecialtyLabels(row.specialty_labels ?? []));
  const insurance = (row.insurance_labels ?? [])
    .map((label) => label.trim())
    .filter(Boolean);

  if (named.some((tag) => matchesNamedTag(specialties, insurance, tag))) return true;
  if (insuranceOther && hasUnlistedInsurance(insurance)) return true;
  if (topicOther && hasUnlistedFindTopic([...specialties])) return true;
  return false;
}

function matchedFindLabels(
  row: Pick<FindOtherRow, "specialty_labels" | "insurance_labels">,
  selected: readonly string[],
) {
  const specialties = new Set(canonicalSpecialtyLabels(row.specialty_labels ?? []));
  const insurance = (row.insurance_labels ?? [])
    .map((label) => label.trim())
    .filter(Boolean);
  const labels: string[] = [];
  for (const tag of selected) {
    if (isFindOtherMarker(tag)) continue;
    if (matchesNamedTag(specialties, insurance, tag) && !labels.includes(tag)) {
      labels.push(tag);
    }
  }
  if (selected.includes(FIND_INSURANCE_OTHER) && hasUnlistedInsurance(insurance)) {
    labels.push(FIND_INSURANCE_OTHER);
  }
  if (selected.includes(FIND_TOPIC_OTHER) && hasUnlistedFindTopic([...specialties])) {
    labels.push(FIND_TOPIC_OTHER);
  }
  return labels;
}

function publishedRank(row: FindOtherRow) {
  return row.published === false ? 0 : 1;
}

function listedRank(row: FindOtherRow) {
  return row.listed === false ? 0 : 1;
}

/**
 * When an Other marker is selected, `search_therapists` was called with no tag
 * list and `p_limit` 500 (offset 0) so this filter sees the directory, not the
 * first 24. Keep rows that match a named tag or that Other rule, then rank
 * drafts, unlisted, overlap, and name — the same order as the RPC.
 */
export function applyFindOtherMatches<T extends FindOtherRow>(
  rows: readonly T[],
  tags: readonly string[],
): T[] {
  const selected = allowedSearchTags([...tags]);
  if (!selected.some((tag) => isFindOtherMarker(tag))) return [...rows];

  const kept = rows
    .filter((row) => therapistMatchesFindTags(row, selected))
    .map((row) => {
      const matched_labels = matchedFindLabels(row, selected);
      return { ...row, matched_labels, match_count: matched_labels.length };
    });

  kept.sort((a, b) => {
    const published = publishedRank(a) - publishedRank(b);
    if (published !== 0) return published;
    const listed = listedRank(a) - listedRank(b);
    if (listed !== 0) return listed;
    if (b.match_count !== a.match_count) return b.match_count - a.match_count;
    return a.name.localeCompare(b.name);
  });
  return kept;
}
