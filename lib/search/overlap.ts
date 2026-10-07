import { INSURANCE_PRESETS, SPECIALTY_PRESETS } from "@/lib/tags/presets";

const SPECIALTY_SET = new Set<string>(SPECIALTY_PRESETS);
const INSURANCE_SET = new Set<string>(INSURANCE_PRESETS);

export function overlapCopy(
  matchCount: number,
  selectedCount: number,
): string | null {
  if (selectedCount <= 0) return null;
  const noun = selectedCount === 1 ? "tag" : "tags";
  return `${matchCount} of ${selectedCount} ${noun}`;
}

function matchingLabels(have: string[], selected: string[]) {
  if (selected.length === 0) return [];
  const wanted = new Set(selected);
  const labels: string[] = [];
  for (const label of have ?? []) {
    if (wanted.has(label) && !labels.includes(label)) labels.push(label);
  }
  return labels;
}

/** Session format, then only specialty and insurance labels in the active filters. */
export function searchCardLabels(
  row: {
    virtual_practice: boolean;
    in_person_practice: boolean;
    specialty_labels: string[];
    insurance_labels: string[];
  },
  selectedTags: string[],
): string[] {
  const labels: string[] = [];
  if (row.virtual_practice) labels.push("Virtual");
  if (row.in_person_practice) labels.push("In-Person");

  const selected = selectedTags ?? [];
  labels.push(
    ...matchingLabels(
      row.specialty_labels,
      selected.filter((tag) => SPECIALTY_SET.has(tag)),
    ),
    ...matchingLabels(
      row.insurance_labels,
      selected.filter((tag) => INSURANCE_SET.has(tag)),
    ),
  );
  return labels;
}
