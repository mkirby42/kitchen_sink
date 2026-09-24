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
  { prompt: "a session with me feels like...", tag: "session_vibe" },
  { prompt: "I specialize in unpacking...", tag: "specialty" },
  { prompt: "who I work best with...", tag: "about" },
  { prompt: "clients say I'm especially good at...", tag: "outcome" },
  { prompt: "I got into this work because...", tag: "about" },
  { prompt: "before we start, you should know...", tag: "about" },
  { prompt: "you'll know it's working when...", tag: "outcome" },
  { prompt: "outside of session, I...", tag: "session_vibe" },
] as const;

export function normalizeCustomLabel(raw: string): string | null {
  const label = raw.trim().replace(/\s+/g, " ");
  return label.length > 0 ? label : null;
}
