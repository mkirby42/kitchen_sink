import type { BoardFilter } from "@/lib/referrals/match";
import { isReferralId, PAYMENT_OPTIONS } from "@/lib/referrals/options";

export type BoardPost = {
  id: string;
  ageRange: string;
  focusAreas: string[];
  payments: string[];
  formats: string[];
  area: string | null;
  timings: string[];
  interestCount: number;
  createdAt: string;
  closesAt: string;
  viewerInterested: boolean;
  viewerIsPoster: boolean;
};

export type MinePost = {
  id: string;
  ageRange: string;
  focusAreas: string[];
  payments: string[];
  formats: string[];
  area: string | null;
  timings: string[];
  status: string;
  interestCount: number;
  createdAt: string;
  approvedAt: string | null;
  closesAt: string | null;
  closedAt: string | null;
  refreshToken: string;
  posterType: string;
};

export type OwnedPost = {
  id: string;
  ageRange: string;
  focusAreas: string[];
  payments: string[];
  formats: string[];
  area: string | null;
  timings: string[];
  status: string;
  interestCount: number;
  createdAt: string;
  closesAt: string | null;
  posterType: string;
};

export type QueuePost = {
  id: string;
  posterId: string;
  posterName: string;
  posterType: string;
  ageRange: string;
  focusAreas: string[];
  payments: string[];
  formats: string[];
  area: string | null;
  timings: string[];
  status: string;
  interestCount: number;
  createdAt: string;
  closesAt: string | null;
  closedAt: string | null;
};

export type RosterTherapist = {
  id: string;
  name: string;
  credential: string | null;
  specialtyLabels: string[];
  insuranceLabels: string[];
  virtual: boolean;
  inPerson: boolean;
  slidingScale: boolean;
  listed: boolean;
  published: boolean;
  openToNewClients: boolean;
};

const KNOWN_ERRORS = [
  "Sign in to post a referral.",
  "A published therapist profile is required.",
  "Confirm the post has no identifying details.",
  "Choose an age range from the list.",
  "Choose focus areas from the list.",
  "Choose payment from the list.",
  "Choose telehealth, in person, or both.",
  "Choose mornings, evenings, or both.",
  "Choose an area from the list.",
  "An area is only for in-person requests.",
  "You can't respond to your own referral.",
  "That referral is not open.",
  "That referral is not available.",
  "That referral can't be refreshed.",
  "That referral is no longer pending.",
  "That referral can't be removed.",
  "Admin access is required.",
  "Pick at least one therapist.",
  "Only interested therapists can be shared.",
];

export function referralError(error: { message?: string; code?: string } | null) {
  const message = error?.message ?? "";
  for (const known of KNOWN_ERRORS) {
    if (message.includes(known)) return known;
  }
  if (
    error?.code === "PGRST202" ||
    error?.code === "42P01" ||
    /schema cache|could not find the function|referral_posts/i.test(message)
  ) {
    return "The referral board isn't available yet.";
  }
  return "Couldn't update that referral.";
}

export function referralSchemaMissing(error: { message?: string; code?: string } | null) {
  return referralError(error) === "The referral board isn't available yet.";
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function toBoardPost(row: Record<string, unknown>): BoardPost | null {
  const id = asString(row.id);
  const closesAt = asString(row.closes_at);
  if (!isReferralId(id) || !closesAt) return null;
  return {
    id,
    ageRange: asString(row.age_range),
    focusAreas: asStringArray(row.focus_areas),
    payments: asStringArray(row.payments),
    formats: asStringArray(row.formats),
    area: asString(row.area) || null,
    timings: asStringArray(row.timings),
    interestCount: Number(row.interest_count) || 0,
    createdAt: asString(row.created_at),
    closesAt,
    viewerInterested: row.viewer_interested === true,
    viewerIsPoster: row.viewer_is_poster === true,
  };
}

export function toMinePost(row: Record<string, unknown>): MinePost | null {
  const id = asString(row.id);
  const refreshToken = asString(row.refresh_token);
  if (!isReferralId(id) || !isReferralId(refreshToken)) return null;
  return {
    id,
    ageRange: asString(row.age_range),
    focusAreas: asStringArray(row.focus_areas),
    payments: asStringArray(row.payments),
    formats: asStringArray(row.formats),
    area: asString(row.area) || null,
    timings: asStringArray(row.timings),
    status: asString(row.status),
    interestCount: Number(row.interest_count) || 0,
    createdAt: asString(row.created_at),
    approvedAt: asString(row.approved_at) || null,
    closesAt: asString(row.closes_at) || null,
    closedAt: asString(row.closed_at) || null,
    refreshToken,
    posterType: asString(row.poster_type),
  };
}

export function toOwnedPost(row: Record<string, unknown>): OwnedPost | null {
  const id = asString(row.id);
  if (!isReferralId(id)) return null;
  return {
    id,
    ageRange: asString(row.age_range),
    focusAreas: asStringArray(row.focus_areas),
    payments: asStringArray(row.payments),
    formats: asStringArray(row.formats),
    area: asString(row.area) || null,
    timings: asStringArray(row.timings),
    status: asString(row.status),
    interestCount: Number(row.interest_count) || 0,
    createdAt: asString(row.created_at),
    closesAt: asString(row.closes_at) || null,
    posterType: asString(row.poster_type),
  };
}

export function toQueuePost(row: Record<string, unknown>): QueuePost | null {
  const id = asString(row.id);
  const posterId = asString(row.poster_id);
  if (!isReferralId(id) || !isReferralId(posterId)) return null;
  return {
    id,
    posterId,
    posterName: asString(row.poster_name).trim() || "Therapist",
    posterType: asString(row.poster_type),
    ageRange: asString(row.age_range),
    focusAreas: asStringArray(row.focus_areas),
    payments: asStringArray(row.payments),
    formats: asStringArray(row.formats),
    area: asString(row.area) || null,
    timings: asStringArray(row.timings),
    status: asString(row.status),
    interestCount: Number(row.interest_count) || 0,
    createdAt: asString(row.created_at),
    closesAt: asString(row.closes_at) || null,
    closedAt: asString(row.closed_at) || null,
  };
}

export function toRosterTherapist(row: Record<string, unknown>): RosterTherapist | null {
  const id = asString(row.therapist_id);
  if (!isReferralId(id)) return null;
  return {
    id,
    name: asString(row.name).trim() || "Therapist",
    credential: asString(row.credential) || null,
    specialtyLabels: asStringArray(row.specialty_labels),
    insuranceLabels: asStringArray(row.insurance_labels),
    virtual: row.virtual_practice === true,
    inPerson: row.in_person_practice === true,
    slidingScale: row.sliding_scale === true,
    listed: row.listed === true,
    published: row.published === true,
    openToNewClients: row.open_to_new_clients === true,
  };
}

export function boardHref(filter: BoardFilter) {
  if (filter.kind === "all") return "/referrals";
  const params = new URLSearchParams();
  if (filter.kind === "matches") params.set("filter", "matches");
  if (filter.kind === "payment") params.set("pay", filter.payment);
  return `/referrals?${params.toString()}`;
}

export function readBoardFilter(
  raw: Record<string, string | string[] | undefined>,
): BoardFilter {
  const pay = first(raw.pay);
  if (
    pay &&
    PAYMENT_OPTIONS.includes(pay as (typeof PAYMENT_OPTIONS)[number])
  ) {
    return { kind: "payment", payment: pay };
  }
  if (first(raw.filter) === "matches") return { kind: "matches" };
  return { kind: "all" };
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
