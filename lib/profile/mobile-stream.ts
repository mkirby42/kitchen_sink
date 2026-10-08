export type MobileStreamSlot<T> =
  | { type: "prompt"; prompt: T }
  | { type: "media" };

/**
 * What follows the lead media card on the mobile profile.
 * A second item (intro video when a photo already leads) sits after the first prompt.
 */
export function mobileStreamAfterHero<T>(
  hasSecondMedia: boolean,
  prompts: readonly T[],
): MobileStreamSlot<T>[] {
  const promptSlots: MobileStreamSlot<T>[] = prompts.map((prompt) => ({
    type: "prompt",
    prompt,
  }));
  if (!hasSecondMedia) return promptSlots;
  const [first, ...rest] = promptSlots;
  if (!first) return [{ type: "media" }];
  return [first, { type: "media" }, ...rest];
}
