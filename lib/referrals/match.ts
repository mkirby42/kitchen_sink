import { canonicalSpecialtyLabel } from "@/lib/tags/presets";
import {
  formatLabel,
  paymentMatchesProfile,
  timingLabel,
  type ReferralDraft,
} from "@/lib/referrals/options";

export type ReferralViewer = {
  specialtyLabels: string[];
  insuranceLabels: string[];
  virtual: boolean;
  inPerson: boolean;
  slidingScale: boolean;
};

export type ReferralPill = {
  label: string;
  matched: boolean;
};

type PillSource = {
  focusAreas: string[];
  payments: string[];
  formats: string[];
  timings: string[];
  area: string | null;
};

export function focusMatches(
  label: string,
  viewer: ReferralViewer,
) {
  const wanted = canonicalSpecialtyLabel(label);
  return viewer.specialtyLabels.some(
    (specialty) => canonicalSpecialtyLabel(specialty) === wanted,
  );
}

export function formatMatches(format: string, viewer: ReferralViewer) {
  if (format === "telehealth") return viewer.virtual;
  if (format === "in_person") return viewer.inPerson;
  return false;
}

/**
 * Matches me is tag overlap: a focus area or a payment.
 * Format is highlighted on the card and does not, by itself, count.
 */
export function postMatchesViewer(post: PillSource, viewer: ReferralViewer) {
  if (post.focusAreas.some((label) => focusMatches(label, viewer))) return true;
  return post.payments.some((payment) =>
    paymentMatchesProfile(payment, viewer.insuranceLabels, viewer.slidingScale),
  );
}

export function referralPills(post: PillSource, viewer: ReferralViewer): ReferralPill[] {
  const pills: ReferralPill[] = [];
  for (const label of post.focusAreas) {
    pills.push({ label, matched: focusMatches(label, viewer) });
  }
  for (const payment of post.payments) {
    pills.push({
      label: payment,
      matched: paymentMatchesProfile(
        payment,
        viewer.insuranceLabels,
        viewer.slidingScale,
      ),
    });
  }
  for (const format of post.formats) {
    pills.push({
      label: formatLabel(format),
      matched: formatMatches(format, viewer),
    });
  }
  for (const timing of post.timings) {
    pills.push({ label: timingLabel(timing), matched: false });
  }
  if (post.area) pills.push({ label: post.area, matched: false });
  return pills;
}

export type BoardFilter =
  | { kind: "all" }
  | { kind: "matches" }
  | { kind: "payment"; payment: string };

export function filterBoardPosts<T extends PillSource>(
  posts: T[],
  viewer: ReferralViewer,
  filter: BoardFilter,
) {
  if (filter.kind === "matches") {
    return posts.filter((post) => postMatchesViewer(post, viewer));
  }
  if (filter.kind === "payment") {
    return posts.filter((post) => post.payments.includes(filter.payment));
  }
  return posts;
}

export function emptyDraft(): ReferralDraft {
  return {
    ageRange: "",
    focusAreas: [],
    payments: [],
    formats: [],
    area: "",
    timings: [],
    attested: false,
  };
}
