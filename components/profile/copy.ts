/** Possessive for profile headings. Always ’s, including names that end in s. */
export function possessive(name: string) {
  return `${name.trim()}'s`;
}

export function yearsPracticingLabel(years: number | null) {
  if (years == null) return null;
  return `${years} yr${years === 1 ? "" : "s"} practicing`;
}

/** Licensed dropdown plus additional credential rows, in that order. */
export function credentialLine(
  credential: string | null,
  extra: string[],
) {
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const raw of [credential, ...extra]) {
    const label = raw?.trim() ?? "";
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    parts.push(label);
  }
  return parts.join(" · ");
}

const MAX_LEAD = 180;

/**
 * First sentence is the serif lead when it is short. The rest of that
 * paragraph, then later paragraphs, stay body copy.
 */
export function splitAboutLead(about: string | null): {
  lead: string | null;
  paragraphs: string[];
} {
  const text = about?.replace(/\r\n/g, "\n").trim() ?? "";
  if (!text) return { lead: null, paragraphs: [] };

  const blocks = text
    .split(/\n\s*\n/)
    .map((block) => block.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
  const first = blocks[0] ?? "";
  const cut = firstSentenceEnd(first);

  if (cut > 0 && cut < first.length) {
    const lead = first.slice(0, cut).trim();
    const rest = first.slice(cut).trim();
    if (lead.length <= MAX_LEAD) {
      return {
        lead,
        paragraphs: [rest, ...blocks.slice(1)].filter(Boolean),
      };
    }
  }

  if (blocks.length > 1 && first.length <= MAX_LEAD) {
    return { lead: first, paragraphs: blocks.slice(1) };
  }
  if (blocks.length === 1 && first.length <= MAX_LEAD && cut === first.length) {
    return { lead: first, paragraphs: [] };
  }
  return { lead: null, paragraphs: blocks };
}

const ABBREV = new Set([
  "dr",
  "mr",
  "mrs",
  "ms",
  "st",
  "jr",
  "sr",
  "vs",
  "etc",
  "eg",
  "ie",
]);

function firstSentenceEnd(text: string) {
  const re = /[.!?](?=\s|$)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    const end = match.index + 1;
    const word = /([A-Za-z]+)$/.exec(text.slice(0, match.index))?.[1] ?? "";
    if (ABBREV.has(word.toLowerCase())) continue;
    return end;
  }
  return -1;
}
