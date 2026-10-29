import { sentenceCasePhrase } from "@/lib/copy/sentence-case";
import { isWorkBestPrompt } from "@/lib/join/cards";
import { FIND_TOPICS } from "@/lib/tags/plain-language";
import {
  canonicalSpecialtyLabel,
  canonicalSpecialtyLabels,
  licenseStateLabel,
} from "@/lib/tags/presets";
import { credentialTitle, yearsPracticing } from "@/lib/therapists/display";

export function findYearsLabel(
  start: string | null | undefined,
  now = new Date(),
) {
  const years = yearsPracticing(start, now);
  if (years == null) return null;
  const noun = years === 1 ? "year" : "years";
  return `${years} ${noun} in practice`;
}

/** “PsyD · Licensed psychologist · 9 years in practice”. Omits a missing piece. */
export function findCredentialLine(
  credential: string | null | undefined,
  start: string | null | undefined,
  now = new Date(),
) {
  const parts = [credentialTitle(credential), findYearsLabel(start, now)].filter(
    (part): part is string => Boolean(part),
  );
  return parts.length ? parts.join(" · ") : null;
}

/** Desktop portrait badge. Virtual is “Online” here. */
export function desktopFormatBadge(virtual: boolean, inPerson: boolean) {
  const parts: string[] = [];
  if (inPerson) parts.push("In person");
  if (virtual) parts.push("Online");
  return parts.length ? parts.join(" · ") : null;
}

/** Tinted-box label. Old and renamed work-best prompts use the mockup heading. */
export function desktopPromptHeading(prompt: string | null | undefined) {
  const text = prompt?.trim() ?? "";
  if (!text) return null;
  if (isWorkBestPrompt(text)) return "I WORK BEST WITH...";
  return text;
}

/** Plain-English topic when we have one; otherwise the stored label. */
export function desktopTopicLabels(specialties: readonly string[]) {
  const canonical = canonicalSpecialtyLabels(specialties);
  const have = new Set(canonical);
  const labels: string[] = [];
  for (const topic of FIND_TOPICS) {
    if (have.has(topic.specialty)) labels.push(topic.plain);
  }
  for (const label of canonical) {
    if (!FIND_TOPICS.some((topic) => topic.specialty === label)) {
      labels.push(sentenceCasePhrase(label));
    }
  }
  return labels;
}

export function desktopInsuranceLabels(labels: readonly string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const label of labels) {
    const next = sentenceCasePhrase(label.trim());
    if (!next || seen.has(next)) continue;
    seen.add(next);
    out.push(next);
  }
  return out;
}

export function licensedInLabel(state: string | null | undefined) {
  if (!state) return null;
  return `Licensed in ${licenseStateLabel(state)}`;
}

export function carouselStatus(index: number, count: number) {
  if (count <= 0) return null;
  const position = Math.min(Math.max(index, 0), count - 1) + 1;
  const verb = count === 1 ? "fits" : "fit";
  return `Therapist ${position} of ${count} who ${verb} what you told us`;
}

export function showTherapistsLabel(count: number | null) {
  if (count == null) return "Show therapists";
  const noun = count === 1 ? "therapist" : "therapists";
  return `Show ${count} ${noun}`;
}

/** Stored specialty for a plain-English chip. Null when it is not a Find topic. */
export function specialtyForPlainLabel(plain: string) {
  return FIND_TOPICS.find((topic) => topic.plain === plain)?.specialty ?? null;
}

export function plainLabelForSpecialty(specialty: string) {
  const canonical = canonicalSpecialtyLabel(specialty);
  return (
    FIND_TOPICS.find((topic) => topic.specialty === canonical)?.plain ??
    sentenceCasePhrase(canonical)
  );
}
