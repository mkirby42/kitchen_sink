/**
 * Display-only expansions for modality tags. `tags.label` stays the stored
 * chip (often a short code). A phrase is left as written.
 */
const MODALITY_ACRONYMS: Record<string, string> = {
  ACT: "Acceptance and Commitment Therapy",
  CBT: "Cognitive Behavioral Therapy",
  DBT: "Dialectical Behavior Therapy",
  EMDR: "Eye Movement Desensitization and Reprocessing",
  IFS: "Internal Family Systems",
  SFBT: "Solution-Focused Brief Therapy",
};

function acronymKey(label: string) {
  return label.replace(/\./g, "").toUpperCase();
}

/** Full name with the acronym in parentheses, or the stored phrase. */
export function modalityDisplayLabel(label: string): string {
  const trimmed = label.trim().replace(/\s+/g, " ");
  if (!trimmed || /\s/.test(trimmed)) return trimmed;
  const key = acronymKey(trimmed);
  const name = MODALITY_ACRONYMS[key];
  if (!name) return trimmed;
  return `${name} (${key})`;
}

export function modalityDisplayLabels(labels: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const label of labels) {
    const next = modalityDisplayLabel(label);
    if (seen.has(next)) continue;
    seen.add(next);
    out.push(next);
  }
  return out;
}
