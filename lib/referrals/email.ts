import {
  EMAIL_SUBJECT,
  formatLabel,
  paymentMatchesProfile,
  timingLabel,
} from "@/lib/referrals/options";
import {
  focusMatches,
  formatMatches,
  type ReferralViewer,
} from "@/lib/referrals/match";
import { routes } from "@/lib/routes";

export type ShareTherapist = {
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

export type SharePost = {
  focusAreas: string[];
  payments: string[];
  formats: string[];
  timings: string[];
};

export function profileIsPublic(therapist: {
  listed: boolean;
  published: boolean;
  openToNewClients: boolean;
}) {
  return therapist.listed && therapist.published && therapist.openToNewClients;
}

export function initials(name: string) {
  const parts = name
    .replace(/[^A-Za-z\s'-]/g, " ")
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return "T";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export function credentialLine(name: string, credential: string | null) {
  const who = name.trim() || "Therapist";
  return credential ? `${who}, ${credential}` : who;
}

/** Labels that line up with the request, then a couple of the therapist's own. */
export function therapistFitLine(post: SharePost, therapist: ShareTherapist) {
  const viewer: ReferralViewer = {
    specialtyLabels: therapist.specialtyLabels,
    insuranceLabels: therapist.insuranceLabels,
    virtual: therapist.virtual,
    inPerson: therapist.inPerson,
    slidingScale: therapist.slidingScale,
  };
  const parts: string[] = [];
  for (const format of post.formats) {
    if (formatMatches(format, viewer)) parts.push(formatLabel(format));
  }
  for (const payment of post.payments) {
    if (
      paymentMatchesProfile(
        payment,
        therapist.insuranceLabels,
        therapist.slidingScale,
      )
    ) {
      parts.push(payment);
    }
  }
  for (const timing of post.timings) parts.push(timingLabel(timing));
  for (const focus of post.focusAreas) {
    if (parts.length >= 4) break;
    if (focusMatches(focus, viewer)) parts.push(focus);
  }
  if (parts.length === 0) {
    const fallback = therapist.specialtyLabels.find((label) => label.trim());
    if (fallback) parts.push(fallback);
  }
  return parts.slice(0, 4).join(" · ");
}

export function referralIntro(count: number) {
  if (count === 1) {
    return "Hi, here is a therapist with openings who matches what you're looking for. Take a look and reach out if it feels right.";
  }
  return `Hi, here are ${count} therapists with openings who match what you're looking for. Take a look and reach out to whoever feels right.`;
}

export function buildClientReferralMessage(input: {
  origin: string;
  post: SharePost;
  therapists: ShareTherapist[];
}) {
  const origin = input.origin.replace(/\/$/, "");
  const blocks = input.therapists.map((therapist) => {
    const fit = therapistFitLine(input.post, therapist);
    const url = `${origin}${routes.therapist(therapist.id)}`;
    return [credentialLine(therapist.name, therapist.credential), fit, url]
      .filter(Boolean)
      .join("\n");
  });
  const body = [referralIntro(input.therapists.length), "", blocks.join("\n\n")].join(
    "\n",
  );
  return { subject: EMAIL_SUBJECT, body };
}

export function buildClientReferralMailto(input: {
  origin: string;
  post: SharePost;
  therapists: ShareTherapist[];
}) {
  const message = buildClientReferralMessage(input);
  const href = `mailto:?subject=${encodeMailto(message.subject)}&body=${encodeMailto(message.body)}`;
  return { ...message, href };
}

/** encodeURIComponent leaves `'`, which breaks a mailto query. */
function encodeMailto(value: string) {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export function buildRefreshEmail(input: {
  ageRange: string;
  refreshUrl: string;
  mineUrl: string;
}) {
  return {
    subject: "Your referral request closed",
    text: [
      `Your referral request (${input.ageRange}) has been up for a week and is off the board.`,
      "",
      "Refresh it for another week:",
      input.refreshUrl,
      "",
      "Or open My referrals and tap Refresh:",
      input.mineUrl,
      "",
      "Refreshing keeps the same request. It does not add a client's name or contact info.",
    ].join("\n"),
  };
}
