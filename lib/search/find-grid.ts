import { credentialTitle, storagePublicUrl, yearsPracticing } from "@/lib/therapists/display";
import {
  hasSuperbill,
  type ContactAction,
} from "@/lib/therapists/load";
import { licenseStateLabel } from "@/lib/tags/presets";
import { desktopInsuranceLabels } from "@/lib/search/find-desktop";
import type { SearchRow } from "@/lib/search/rpc";

/** Desktop grid page. The search already caps the directory at 24. */
export const FIND_GRID_PAGE_SIZE = 8;

const NOT_A_PLAN = new Set(["out-of-network superbill", "cash pay only"]);
const WORK_BEST = /work best with/i;

export type FindDetailCard = {
  prompt: string;
  answer: string;
};

export type FindDetailProfile = {
  name: string;
  credential: string | null;
  photoUrl: string | null;
  videoUrl: string | null;
  virtual: boolean;
  inPerson: boolean;
  insurance: string[];
  superbill: boolean;
  licenses: { state: string }[];
  cards: FindDetailCard[];
  contact: ContactAction[];
};

export type FindDetailContent = {
  id: string;
  name: string;
  credentialLine: string | null;
  yearsLabel: string | null;
  photoUrl: string | null;
  videoUrl: string | null;
  inPerson: boolean;
  virtual: boolean;
  licenseFacts: string[];
  insuranceLine: string | null;
  superbill: boolean;
  lead: FindDetailCard | null;
  rest: FindDetailCard[];
  consult: { href: string; cta: "consult" | "book" } | null;
  hidden: boolean;
  draft: boolean;
};

export function gridVisibleCount(total: number, morePages: number) {
  const pages = Math.max(0, morePages) + 1;
  return Math.min(Math.max(0, total), pages * FIND_GRID_PAGE_SIZE);
}

/** Null when every result is already on screen. Names the real remainder. */
export function gridShowMoreLabel(total: number, visible: number) {
  const remaining = Math.max(0, total - visible);
  if (remaining <= 0) return null;
  const next = Math.min(FIND_GRID_PAGE_SIZE, remaining);
  return `Show ${next} more`;
}

export function gridFitLine(count: number) {
  const verb = count === 1 ? "fits" : "fit";
  const noun = count === 1 ? "therapist" : "therapists";
  return `${count} ${noun} ${verb} what you told us`;
}

/** Short years line for the compact card and the detail facts. */
export function gridYearsLabel(
  start: string | null | undefined,
  now = new Date(),
) {
  const years = yearsPracticing(start, now);
  if (years == null) return null;
  const noun = years === 1 ? "yr" : "yrs";
  return `${years} ${noun} in practice`;
}

function planLabels(labels: readonly string[]) {
  return desktopInsuranceLabels(labels).filter(
    (label) => !NOT_A_PLAN.has(label.toLowerCase()),
  );
}

/**
 * Selected insurance the therapist accepts. With no insurance filter, the
 * first plan they take — still one fact, not the whole list.
 */
export function takesInsuranceLine(
  labels: readonly string[],
  selected: readonly string[],
) {
  const plans = planLabels(labels);
  if (plans.length === 0) return null;
  const wanted = new Set(selected.map((tag) => tag.toLowerCase()));
  const matched = plans.filter((plan) => wanted.has(plan.toLowerCase()));
  const shown = matched.length > 0 ? matched : [plans[0]];
  return `Takes ${shown.join(", ")}`;
}

export function detailInsuranceLine(labels: readonly string[]) {
  const plans = planLabels(labels);
  return plans.length > 0 ? plans.join(", ") : null;
}

export function detailLicenseFacts(
  licenses: readonly { state: string }[],
  filterState: string | null,
) {
  const states = licenses
    .map((license) => license.state.trim())
    .filter(Boolean);
  if (states.length === 0 && filterState) states.push(filterState);
  const seen = new Set<string>();
  const facts: string[] = [];
  for (const state of states) {
    const place = licenseStateLabel(state);
    if (!place || seen.has(place)) continue;
    seen.add(place);
    facts.push(`Licensed in ${place}`);
  }
  return facts;
}

export function splitDetailCards(cards: readonly FindDetailCard[]) {
  const usable = cards
    .map((card) => ({
      prompt: card.prompt.trim(),
      answer: card.answer.trim(),
    }))
    .filter((card) => card.prompt && card.answer);
  if (usable.length === 0) return { lead: null, rest: [] as FindDetailCard[] };
  const leadAt = usable.findIndex((card) => WORK_BEST.test(card.prompt));
  const index = leadAt >= 0 ? leadAt : 0;
  return {
    lead: usable[index] ?? null,
    rest: usable.filter((_, i) => i !== index),
  };
}

/** Email when they list it, otherwise a phone. Not a calendar. */
export function detailConsult(contact: readonly ContactAction[]) {
  const email = contact.find((item) => item.kind === "email");
  if (email) return { href: email.href, cta: "consult" as const };
  const phone =
    contact.find((item) => item.kind === "phone") ??
    contact.find((item) => item.kind === "text");
  if (phone) return { href: phone.href, cta: "book" as const };
  return null;
}

export function buildFindDetail(input: {
  row: SearchRow;
  profile: FindDetailProfile | null;
  filterState: string | null;
  now?: Date;
}): FindDetailContent {
  const { row, profile } = input;
  const profileCards = profile?.cards ?? [];
  const hasProfileCards = profileCards.some(
    (card) => card.prompt.trim() && card.answer.trim(),
  );
  const cards = hasProfileCards
    ? profileCards
    : row.card_prompt?.trim() && row.card_answer?.trim()
      ? [{ prompt: row.card_prompt, answer: row.card_answer }]
      : [];
  const { lead, rest } = splitDetailCards(cards);
  const insurance = profile?.insurance ?? row.insurance_labels;

  return {
    id: row.profile_id,
    name: profile?.name?.trim() || row.name,
    credentialLine: credentialTitle(profile?.credential ?? row.credential),
    yearsLabel: gridYearsLabel(row.start_date_of_practice, input.now),
    photoUrl:
      profile?.photoUrl ?? storagePublicUrl("photos", row.photo_key),
    videoUrl:
      profile?.videoUrl ?? storagePublicUrl("videos", row.video_key),
    inPerson: profile?.inPerson ?? row.in_person_practice,
    virtual: profile?.virtual ?? row.virtual_practice,
    licenseFacts: detailLicenseFacts(
      profile?.licenses ?? [],
      input.filterState,
    ),
    insuranceLine: detailInsuranceLine(insurance),
    superbill: profile
      ? hasSuperbill(profile.insurance, profile.superbill)
      : hasSuperbill(row.insurance_labels, false),
    lead,
    rest,
    consult: detailConsult(profile?.contact ?? []),
    hidden: row.listed === false,
    draft: row.published === false,
  };
}
