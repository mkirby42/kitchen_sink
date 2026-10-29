export const MIN_CONVERSATION_CARDS = 3;
export const MAX_CONVERSATION_CARDS = 6;

export function answeredConversationCardCount(
  cards: readonly { prompt: string; answer: string }[],
): number {
  return cards.filter((card) => card.prompt.trim() && card.answer.trim())
    .length;
}

export const CONVERSATION_PROMPTS = [
  { prompt: "my approach to therapy is...", tag: "approach" },
  { prompt: "my personal philosophy in therapy is...", tag: "approach" },
  { prompt: "a session with me feels like...", tag: "session_vibe" },
  {
    prompt: "what you can expect in our first session together...",
    tag: "session_vibe",
  },
  { prompt: "I specialize in unpacking...", tag: "specialty" },
  { prompt: "people often come to me because...", tag: "specialty" },
  { prompt: "I enjoy working with people who...", tag: "about" },
  { prompt: "I got into this work because...", tag: "about" },
  { prompt: "outside of session, I...", tag: "about" },
  { prompt: "I know therapy is working when...", tag: "outcome" },
  { prompt: "you'll know it's working when...", tag: "outcome" },
] as const;

/** Current About me slot for the old who-I-work-best-with card. */
export const ENJOY_WORKING_PROMPT = "I enjoy working with people who...";

const LEGACY_WORK_BEST = ["who i work best with...", "i work best with..."];

const RETIRED_PROMPTS = [
  "before we start, you should know...",
  "clients say i'm especially good at...",
];

const CARD_TAGS = new Set([
  "approach",
  "session_vibe",
  "specialty",
  "about",
  "outcome",
  "custom",
]);

export type SavedConversationCard = {
  prompt: string;
  answer: string;
  tag: string;
};

export function normalizePromptKey(prompt: string | null | undefined) {
  return (prompt ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

/** Old work-best wording and the renamed About me prompt. */
export function isWorkBestPrompt(prompt: string | null | undefined) {
  const key = normalizePromptKey(prompt);
  if (!key) return false;
  if (key === normalizePromptKey(ENJOY_WORKING_PROMPT)) return true;
  return /work best with/.test(key);
}

export function isRetiredPrompt(prompt: string | null | undefined) {
  const key = normalizePromptKey(prompt);
  return RETIRED_PROMPTS.includes(key);
}

/**
 * Public profile and Find detail label.
 * Legacy work-best answers stay on the stored prompt. Those answers were
 * written to finish "who I work best with..." (often a noun phrase) and
 * usually do not read correctly under "I enjoy working with people who...".
 * Edit loads the answer into that new slot; the next save stores the new
 * label. Until then the public page keeps the stored sentence. Retired
 * prompts also keep their stored label.
 */
export function publicConversationPrompt(prompt: string) {
  return prompt.trim().replace(/\s+/g, " ");
}

/**
 * Edit-flow cards. Legacy work-best answers fill the renamed slot so the
 * next save writes the new label. A second legacy answer, or one that
 * already sits beside the new prompt, stays as a custom card with its
 * original label. "outside of session, I..." moves to About me with the
 * same text. Retired prompts stay as custom cards with their original label
 * so a re-save does not drop them.
 */
export function builderCardsFromSaved(
  items: readonly SavedConversationCard[],
): SavedConversationCard[] {
  const presets = new Map(
    CONVERSATION_PROMPTS.map((item) => [normalizePromptKey(item.prompt), item]),
  );
  const enjoyKey = normalizePromptKey(ENJOY_WORKING_PROMPT);
  const hasEnjoy = items.some(
    (item) => normalizePromptKey(item.prompt) === enjoyKey,
  );
  let mappedLegacy = false;

  const cards: SavedConversationCard[] = [];
  for (const item of items) {
    const prompt = item.prompt.trim().replace(/\s+/g, " ");
    if (!prompt) continue;
    const key = normalizePromptKey(prompt);
    const legacy =
      LEGACY_WORK_BEST.includes(key) ||
      (/work best with/.test(key) && key !== enjoyKey);

    if (legacy) {
      if (!hasEnjoy && !mappedLegacy) {
        mappedLegacy = true;
        cards.push({
          prompt: ENJOY_WORKING_PROMPT,
          answer: item.answer,
          tag: "about",
        });
      } else {
        cards.push({ prompt, answer: item.answer, tag: "custom" });
      }
      continue;
    }

    if (isRetiredPrompt(prompt)) {
      cards.push({ prompt, answer: item.answer, tag: "custom" });
      continue;
    }

    const preset = presets.get(key);
    if (preset) {
      cards.push({
        prompt: preset.prompt,
        answer: item.answer,
        tag: preset.tag,
      });
      continue;
    }

    cards.push({
      prompt,
      answer: item.answer,
      tag: CARD_TAGS.has(item.tag) ? item.tag : "custom",
    });
  }
  return cards;
}

export function normalizeCustomLabel(raw: string): string | null {
  const label = raw.trim().replace(/\s+/g, " ");
  return label.length > 0 ? label : null;
}
