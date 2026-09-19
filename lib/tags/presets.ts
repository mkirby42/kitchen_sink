export const SPECIALTY_PRESETS = [
  "Anxiety",
  "Depression",
  "Trauma & PTSD",
  "Couples & Relationships",
  "ADHD",
  "Grief & Loss",
  "Life Transitions",
  "Teens",
  "Immigration",
] as const;

export const INSURANCE_PRESETS = [
  "Aetna",
  "BCBS",
  "Cigna",
  "Optum",
  "Cash Pay Only",
  "Out-of-Network Superbill",
] as const;

export const SEARCH_SPECIALTY_MAX_LENGTH = 48;

export function normalizeSpecialtyFilterLabel(
  raw: string,
  knownLabels: readonly string[] = [
    ...SPECIALTY_PRESETS,
    ...INSURANCE_PRESETS,
  ],
): string | null {
  const label = raw.replace(/,/g, " ").replace(/\s+/g, " ").trim();
  if (!label) return null;
  const known = knownLabels.find(
    (item) => item.toLowerCase() === label.toLowerCase(),
  );
  if (known) return known;
  return label.slice(0, SEARCH_SPECIALTY_MAX_LENGTH).trim();
}

export function specialtyFilterChips(selected: string[]) {
  const preset = new Set<string>(SPECIALTY_PRESETS);
  const insurance = new Set<string>(INSURANCE_PRESETS);
  const custom = selected.filter(
    (tag) => !preset.has(tag) && !insurance.has(tag),
  );
  return [...SPECIALTY_PRESETS, ...custom];
}

export const LICENSE_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
  "DC",
] as const;
