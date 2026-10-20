import { canonicalSpecialtyLabel } from "@/lib/tags/presets";

/** Keep these aligned with private.referral_*() in the referral migration. */
export const REFERRAL_OPEN_DAYS = 7;

export const AGE_RANGES = [
  "Child, 0-5",
  "Child, 6-12",
  "Teen, 13-17",
  "Adult, 18-29",
  "Adult, 30s",
  "Adult, 40s",
  "Adult, 50s",
  "Adult, 60+",
] as const;

export const FOCUS_AREAS = [
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

export const PAYMENT_OPTIONS = [
  "Aetna",
  "BCBS",
  "Cigna",
  "Optum",
  "Out-of-Network Superbill",
  "Private pay",
  "Sliding scale",
] as const;

export const FORMAT_OPTIONS = ["telehealth", "in_person"] as const;

export const TIMING_OPTIONS = ["mornings", "evenings"] as const;

export const AREA_OPTIONS = [
  "Central Austin",
  "North Austin",
  "South Austin",
  "East Austin",
  "West Austin",
  "Round Rock",
  "Cedar Park",
  "Pflugerville",
  "Greater Austin",
] as const;

export const REFERRAL_ATTESTATION =
  "This post contains no identifying details, and my client knows I'm looking for a referral.";

export const REFERRAL_PRIVACY_NOTE =
  "Therapists with a published profile can see this post. Keep it general: no names, employers, birthdays, or trauma details.";

export const EMAIL_SUBJECT = "Therapists who'd be a good fit for you";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isReferralId(value: string) {
  return UUID_RE.test(value);
}

export function formatLabel(value: string) {
  if (value === "telehealth") return "Telehealth";
  if (value === "in_person") return "In person";
  return value;
}

export function timingLabel(value: string) {
  if (value === "mornings") return "Mornings";
  if (value === "evenings") return "Evenings";
  return value;
}

export type ReferralDraft = {
  ageRange: string;
  focusAreas: string[];
  payments: string[];
  formats: string[];
  area: string;
  timings: string[];
  attested: boolean;
};

function unique(values: string[]) {
  return values.filter((value, index) => values.indexOf(value) === index);
}

function subset(values: string[], allowed: readonly string[]) {
  return values.every((value) => allowed.includes(value));
}

/** Client-side check. The database rejects the same cases. */
export function referralDraftError(draft: ReferralDraft): string | null {
  if (!draft.attested) return "Confirm the post has no identifying details.";
  if (!AGE_RANGES.includes(draft.ageRange as (typeof AGE_RANGES)[number])) {
    return "Choose an age range from the list.";
  }
  const focus = unique(draft.focusAreas);
  if (
    focus.length < 1 ||
    focus.length > 8 ||
    focus.length !== draft.focusAreas.length ||
    !subset(focus, FOCUS_AREAS)
  ) {
    return "Choose focus areas from the list.";
  }
  const payments = unique(draft.payments);
  if (
    payments.length < 1 ||
    payments.length > 8 ||
    payments.length !== draft.payments.length ||
    !subset(payments, PAYMENT_OPTIONS)
  ) {
    return "Choose payment from the list.";
  }
  const formats = unique(draft.formats);
  if (
    formats.length < 1 ||
    formats.length > 2 ||
    formats.length !== draft.formats.length ||
    !subset(formats, FORMAT_OPTIONS)
  ) {
    return "Choose telehealth, in person, or both.";
  }
  const timings = unique(draft.timings);
  if (
    timings.length < 1 ||
    timings.length > 2 ||
    timings.length !== draft.timings.length ||
    !subset(timings, TIMING_OPTIONS)
  ) {
    return "Choose mornings, evenings, or both.";
  }
  const area = draft.area.trim();
  if (area && !AREA_OPTIONS.includes(area as (typeof AREA_OPTIONS)[number])) {
    return "Choose an area from the list.";
  }
  if (area && !formats.includes("in_person")) {
    return "An area is only for in-person requests.";
  }
  return null;
}

export function referralHeadline(input: {
  ageRange: string;
  formats: string[];
}) {
  return [input.ageRange, ...input.formats.map(formatLabel)].join(" · ");
}

/** Cash Pay Only on a profile lines up with the Private pay chip. */
export function paymentMatchesProfile(
  payment: string,
  insuranceLabels: readonly string[],
  slidingScale: boolean,
) {
  if (payment === "Sliding scale") return slidingScale;
  if (payment === "Private pay") {
    return insuranceLabels.some((label) => {
      const canonical = canonicalSpecialtyLabel(label);
      return canonical === "Cash Pay Only" || canonical === "Private pay";
    });
  }
  return insuranceLabels.includes(payment);
}
