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

const SEARCH_FILTER_TAGS = new Set<string>([
  ...SPECIALTY_PRESETS,
  ...INSURANCE_PRESETS,
]);

export function allowedSearchTags(tags: string[]) {
  return tags.filter((tag) => SEARCH_FILTER_TAGS.has(tag));
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
