import { sentenceCasePhrase } from "@/lib/copy/sentence-case";

/** Travis White — public profile hides education only. Keep in sync with scripts/travis-white/profile.mjs. */
export const TRAVIS_PROFILE_ID = "3b354f1e-50a1-4a17-b536-cc7fce1296fe";

function filled(values: readonly string[]) {
  return values.map((value) => value.trim()).filter(Boolean);
}

/**
 * Public profile only. Travis's stored education stays on the join form
 * and in the database; the public page omits those lines.
 */
export function publicEducationLines(
  profileId: string,
  education: readonly string[],
) {
  if (profileId === TRAVIS_PROFILE_ID) return [];
  return filled(education);
}

/** Additional credential rows for the public facts card. */
export function publicCredentialLines(credentials: readonly string[]) {
  return filled(credentials).map((line) => sentenceCasePhrase(line));
}
