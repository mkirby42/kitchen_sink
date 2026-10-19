/** Wall clock for relative labels. Kept out of components so render stays pure. */
export function referralNow() {
  return Date.now();
}

export type ReferralLife = {
  status: string;
  closesAt: string | null;
};

export function postedAgo(iso: string, now: number) {
  const delta = Math.max(0, now - new Date(iso).getTime());
  const minutes = Math.floor(delta / 60_000);
  if (minutes < 1) return "Posted just now";
  if (minutes < 60) return `Posted ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Posted ${hours}h ago`;
  return `Posted ${Math.floor(hours / 24)}d ago`;
}

export function closesLabel(iso: string | null, now: number) {
  if (!iso) return "Not open yet";
  const delta = new Date(iso).getTime() - now;
  if (delta <= 0) return "Closed";
  const minutes = Math.floor(delta / 60_000);
  if (minutes < 60) return "Closes soon";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Closes in ${hours}h`;
  return `Closes in ${Math.floor(hours / 24)}d`;
}

export type ReferralPhase =
  | "Pending"
  | "Live"
  | "Expired"
  | "Closed"
  | "Rejected"
  | "Removed";

export function referralPhase(post: ReferralLife, now: number): ReferralPhase {
  if (post.status === "pending") return "Pending";
  if (post.status === "rejected") return "Rejected";
  if (post.status === "removed") return "Removed";
  if (post.status === "closed") return "Closed";
  if (post.status === "approved") {
    if (post.closesAt && new Date(post.closesAt).getTime() > now) return "Live";
    return "Expired";
  }
  return "Closed";
}

export function canRefresh(phase: ReferralPhase) {
  return phase === "Expired" || phase === "Closed";
}

export function canCloseEarly(phase: ReferralPhase) {
  return phase === "Live";
}

export function canReviewInterest(phase: ReferralPhase) {
  return phase === "Live" || phase === "Expired" || phase === "Closed";
}

export function interestCountLabel(count: number) {
  if (count === 1) return "1 therapist interested";
  return `${count} therapists interested`;
}
