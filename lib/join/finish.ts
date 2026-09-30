export type FinishJoinResult =
  | { ok: true; saved: true }
  | { ok: false; saved: boolean; error: string };

export async function finishJoin(input: {
  alreadySaved: boolean;
  feedback: string | null;
  save: () => Promise<string | null>;
  notify: (
    feedback: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
}): Promise<FinishJoinResult> {
  if (!input.alreadySaved) {
    const error = await input.save();
    if (error) return { ok: false, saved: false, error };
  }

  if (input.feedback) {
    const mailed = await input.notify(input.feedback);
    if (!mailed.ok) return { ok: false, saved: true, error: mailed.error };
  }

  return { ok: true, saved: true };
}
