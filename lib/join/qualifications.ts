export const QUALIFICATION_MAX_LENGTH = 120;

export function normalizeQualificationLabel(raw: string): string | null {
  const label = raw.trim().replace(/\s+/g, " ");
  if (!label) return null;
  return label.slice(0, QUALIFICATION_MAX_LENGTH);
}

export function compactQualificationList(items: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const label = normalizeQualificationLabel(item);
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return out;
}

export function qualificationRows(
  education: string[],
  credentials: string[],
) {
  return [
    ...compactQualificationList(education).map((label, position) => ({
      kind: "education" as const,
      label,
      position,
    })),
    ...compactQualificationList(credentials).map((label, position) => ({
      kind: "credential" as const,
      label,
      position,
    })),
  ];
}
