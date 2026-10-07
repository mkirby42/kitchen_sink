export type FinishJoinResult =
  | { ok: true; saved: true }
  | { ok: false; saved: false; error: string };

export async function finishJoin(input: {
  feedback: string | null;
  save: () => Promise<string | null>;
  notify: (feedback: string) => Promise<unknown>;
}): Promise<FinishJoinResult> {
  const error = await input.save();
  if (error) return { ok: false, saved: false, error };

  if (input.feedback) {
    try {
      await input.notify(input.feedback);
    } catch {
      // The note is already stored. Scheduling the ops email must not
      // keep the therapist on this step.
    }
  }

  return { ok: true, saved: true };
}
