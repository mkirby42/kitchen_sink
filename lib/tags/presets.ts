export const SPECIALTY_PRESETS = [
  "Anxiety",
  "Depression",
  "Trauma & PTSD",
  "Couples & Relationships",
  "ADHD",
  "Grief & Loss",
  "Life Transitions",
  "Self Discovery",
  "Immigration",
] as const;

/** Specialty chip renamed in place. Stored rows may still say the old label. */
const LEGACY_SPECIALTY_LABELS: Record<string, string> = {
  Teens: "Self Discovery",
};

export function canonicalSpecialtyLabel(label: string) {
  return LEGACY_SPECIALTY_LABELS[label] ?? label;
}

export function canonicalSpecialtyLabels(labels: readonly string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const label of labels) {
    const next = canonicalSpecialtyLabel(label);
    if (seen.has(next)) continue;
    seen.add(next);
    out.push(next);
  }
  return out;
}

/** Profile Areas of Interest. Teens shows as Self Discovery. Custom labels stay. */
export function directorySpecialties(labels: readonly string[]): string[] {
  return canonicalSpecialtyLabels(labels);
}

export const INSURANCE_PRESETS = [
  "Aetna",
  "BCBS",
  "Cigna",
  "Optum",
  "Cash Pay Only",
  "Out-of-Network Superbill",
] as const;

/**
 * Find address marker for insurance Other. Not an `INSURANCE_PRESETS` chip,
 * so Join does not offer it.
 */
export const FIND_INSURANCE_OTHER = "Other";

/**
 * Find address marker for What's going on → Other.
 * Distinct from FIND_INSURANCE_OTHER: both filters share `tags`.
 */
export const FIND_TOPIC_OTHER = "Other topic";

/** Find insurance sheet and desktop menu. Join keeps `INSURANCE_PRESETS`. */
export const FIND_INSURANCE_OPTIONS = [
  ...INSURANCE_PRESETS,
  FIND_INSURANCE_OTHER,
] as const;

const SEARCH_FILTER_TAGS = new Set<string>([
  ...SPECIALTY_PRESETS,
  ...INSURANCE_PRESETS,
]);

const FIND_OTHER_SENTINELS = new Set<string>([
  FIND_INSURANCE_OTHER,
  FIND_TOPIC_OTHER,
]);

export function isFindOtherMarker(tag: string) {
  return FIND_OTHER_SENTINELS.has(tag);
}

export function isFindInsuranceChoice(tag: string) {
  return (
    (INSURANCE_PRESETS as readonly string[]).includes(tag) ||
    tag === FIND_INSURANCE_OTHER
  );
}

export function allowedSearchTags(tags: string[]) {
  return canonicalSpecialtyLabels(tags).filter(
    (tag) => SEARCH_FILTER_TAGS.has(tag) || FIND_OTHER_SENTINELS.has(tag),
  );
}

/**
 * Query labels. Self Discovery also matches a specialty row still stored as Teens.
 * Other markers are not stored presets. When one is selected, the RPC gets no tag
 * list (it cannot express unlisted OR). `searchRpcArgs` raises that call's limit
 * to 500 so Find can keep named-tag OR Other matches in `applyFindOtherMatches`.
 */
export function searchQueryTags(tags: string[]) {
  const selected = allowedSearchTags(tags);
  if (selected.some((tag) => FIND_OTHER_SENTINELS.has(tag))) return [];
  const query = [...selected];
  for (const [legacy, current] of Object.entries(LEGACY_SPECIALTY_LABELS)) {
    if (selected.includes(current) && !query.includes(legacy)) {
      query.push(legacy);
    }
  }
  return query;
}

export const CREDENTIALS = [
  "LMFT",
  "LCSW",
  "LPC",
  "PsyD",
  "PhD",
  "MD",
] as const;

export const MODALITY_PRESETS = [
  "CBT",
  "DBT",
  "EMDR",
  "Psychodynamic",
  "ACT",
  "Somatic",
  "Narrative",
  "Attachment-Based",
] as const;

export const IDENTITY_PRESETS = [
  "BIPOC",
  "LGBTQ+",
  "Immigrant",
  "First-generation",
  "Veteran",
  "Disabled",
] as const;

export const RATE_SERVICE_TYPES = ["Individual", "Couples", "Family", "Group"] as const;
export const OUTREACH_OPTIONS = ["email", "phone", "text"] as const;

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

export type LicenseState = (typeof LICENSE_STATES)[number];

const LICENSE_STATE_SET = new Set<string>(LICENSE_STATES);

/** Find sends a state code only. A typed note is not a license-state filter. */
export function allowedLicenseState(value: string | null | undefined) {
  const code = value?.trim().toUpperCase() ?? "";
  return LICENSE_STATE_SET.has(code) ? code : null;
}

export const LICENSE_STATE_NAMES: Record<LicenseState, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
};

export function licenseStateEntries() {
  return LICENSE_STATES.map((code) => ({
    code,
    name: LICENSE_STATE_NAMES[code],
  }));
}

export function licenseStateLabel(code: string) {
  return LICENSE_STATE_NAMES[code as LicenseState] ?? code;
}

export function filterLicenseStates(query: string) {
  const q = query.trim().toLowerCase();
  const all = licenseStateEntries();
  if (!q) return all;

  const exactCode = all.filter((state) => state.code.toLowerCase() === q);
  if (exactCode.length) return exactCode;

  return all.filter(({ code, name }) => {
    const codeL = code.toLowerCase();
    const nameL = name.toLowerCase();
    if (codeL.startsWith(q) || nameL.startsWith(q)) return true;
    if (nameL.split(/[\s,.]+/).some((word) => word.startsWith(q))) return true;
    return q.length >= 3 && nameL.includes(q);
  });
}

export function resolveLicenseState(query: string): LicenseState | null {
  const matches = filterLicenseStates(query);
  return matches.length === 1 ? matches[0].code : null;
}
