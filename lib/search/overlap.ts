export function overlapCopy(
  matchCount: number,
  selectedCount: number,
): string | null {
  if (selectedCount <= 0) return null;
  const noun = selectedCount === 1 ? "tag" : "tags";
  return `${matchCount} of ${selectedCount} ${noun}`;
}

export function searchCardLabels(row: {
  virtual_practice: boolean;
  in_person_practice: boolean;
  specialty_labels: string[];
  matched_labels: string[];
}): string[] {
  const labels: string[] = [];
  if (row.virtual_practice) labels.push("Virtual");
  if (row.in_person_practice) labels.push("In-Person");
  for (const label of row.specialty_labels ?? []) {
    if (!labels.includes(label)) labels.push(label);
  }
  for (const label of row.matched_labels ?? []) {
    if (!labels.includes(label)) labels.push(label);
  }
  return labels;
}

export function isMatchedLabel(label: string, matchedLabels: string[]) {
  return matchedLabels.includes(label);
}
