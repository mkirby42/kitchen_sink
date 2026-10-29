import { sentenceCasePhrase } from "@/lib/copy/sentence-case";
import { isWorkBestPrompt } from "@/lib/join/cards";
import {
  detailInsuranceLine,
  gridYearsLabel,
} from "@/lib/search/find-grid";
import {
  detailPublicFields,
  type FindDetailPublic,
} from "@/lib/search/find-detail-fields";
import type { SearchRow } from "@/lib/search/rpc";
import { licenseStateLabel } from "@/lib/tags/presets";
import {
  credentialTitle,
  storagePublicUrl,
  type ProfileOffice,
} from "@/lib/therapists/display";
import {
  hasSuperbill,
  type ContactAction,
  type ProfileRate,
  type ProfileReview,
} from "@/lib/therapists/load";

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
  licenses: { state: string; number?: string }[];
  cards: FindDetailCard[];
  contact: ContactAction[];
  credentials?: string[];
  education?: string[];
  specialties?: string[];
  modalities?: string[];
  identity?: string[];
  rates?: ProfileRate[];
  slidingScale?: boolean;
  slidingScaleMinCents?: number | null;
  slidingScaleMaxCents?: number | null;
  office?: ProfileOffice | null;
  about?: string | null;
  voiceUrl?: string | null;
  voicePrompt?: string | null;
  reviews?: ProfileReview[];
  openToNewClients?: boolean;
  givenName?: string;
};

export type FindDetailContent = FindDetailPublic & {
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
  book: { href: string; cta: "book" } | null;
  /** Every listed outreach row. Booking buttons open these; they do not navigate. */
  contact: ContactAction[];
  hidden: boolean;
  draft: boolean;
};

export function detailLicenseFacts(
  licenses: readonly { state: string; number?: string }[],
  filterState: string | null,
) {
  const rows = licenses
    .map((license) => ({
      state: license.state.trim(),
      number: license.number?.trim() ?? "",
    }))
    .filter((license) => license.state);
  if (rows.length === 0 && filterState) {
    rows.push({ state: filterState, number: "" });
  }
  const seen = new Set<string>();
  const facts: string[] = [];
  for (const license of rows) {
    const place = licenseStateLabel(license.state);
    if (!place || seen.has(place)) continue;
    seen.add(place);
    facts.push(
      license.number
        ? `Licensed in ${place} (#${license.number})`
        : `Licensed in ${place}`,
    );
  }
  return facts;
}

/**
 * Licensed title, then any additional credentials they saved.
 * Skips an extra that only repeats the code or its expanded title
 * ("PsyD · Licensed psychologist" plus a stored "Licensed Psychologist").
 */
export function detailCredentialLine(
  credential: string | null | undefined,
  extra: readonly string[] = [],
) {
  const title = credentialTitle(credential);
  const code = credential?.trim() ?? "";
  const suffix =
    title && code && title.toLowerCase().startsWith(`${code.toLowerCase()} · `)
      ? title.slice(code.length + 3)
      : "";
  const seen = new Set<string>();
  for (const value of [code, title ?? "", suffix]) {
    const key = value.trim().toLowerCase();
    if (key) seen.add(key);
  }
  const extras: string[] = [];
  for (const raw of extra) {
    const label = sentenceCasePhrase(raw.trim());
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    extras.push(label);
  }
  const parts = [title, ...extras].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}

/** Phone or text, when it is not already the only consult link. */
export function detailBookLink(
  contact: readonly ContactAction[],
  consultHref: string | null,
) {
  const phone =
    contact.find((item) => item.kind === "phone") ??
    contact.find((item) => item.kind === "text");
  if (!phone || phone.href === consultHref) return null;
  return { href: phone.href, cta: "book" as const };
}

export function splitDetailCards(cards: readonly FindDetailCard[]) {
  const usable = cards
    .map((card) => ({
      prompt: card.prompt.trim(),
      answer: card.answer.trim(),
    }))
    .filter((card) => card.prompt && card.answer);
  if (usable.length === 0) return { lead: null, rest: [] as FindDetailCard[] };
  const leadAt = usable.findIndex((card) => isWorkBestPrompt(card.prompt));
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
  const name = profile?.name?.trim() || row.name;
  const inPerson = profile?.inPerson ?? row.in_person_practice;
  const consult = detailConsult(profile?.contact ?? []);

  return {
    id: row.profile_id,
    name,
    credentialLine: detailCredentialLine(
      profile?.credential ?? row.credential,
      profile?.credentials ?? [],
    ),
    yearsLabel: gridYearsLabel(row.start_date_of_practice, input.now),
    photoUrl: profile?.photoUrl ?? storagePublicUrl("photos", row.photo_key),
    videoUrl: profile?.videoUrl ?? storagePublicUrl("videos", row.video_key),
    inPerson,
    virtual: profile?.virtual ?? row.virtual_practice,
    licenseFacts: detailLicenseFacts(profile?.licenses ?? [], input.filterState),
    insuranceLine: detailInsuranceLine(insurance),
    superbill: profile
      ? hasSuperbill(profile.insurance, profile.superbill)
      : hasSuperbill(row.insurance_labels, false),
    lead,
    rest,
    consult,
    book: detailBookLink(profile?.contact ?? [], consult?.href ?? null),
    contact: profile?.contact ?? [],
    hidden: row.listed === false,
    draft: row.published === false,
    ...detailPublicFields({
      name,
      inPerson,
      insurance,
      profile,
    }),
  };
}
