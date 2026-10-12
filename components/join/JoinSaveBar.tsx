import { Button } from "@/components/ui/Button";
import type { EditorSaveAction } from "@/lib/join/publish";

export function JoinSaveBar({
  step,
  live,
  actions,
  blocked,
  submitting,
  mediaBusy,
  saveIntent,
  submitError,
  hint,
  error,
  mediaNote,
  onContinue,
  onSave,
}: {
  step: 1 | 2 | 3 | 4;
  live: boolean;
  actions: { draft: boolean; publish: boolean; saveChanges: boolean };
  blocked: boolean;
  submitting: boolean;
  mediaBusy: boolean;
  saveIntent: EditorSaveAction | null;
  submitError: string;
  hint: string;
  error?: string;
  mediaNote?: string | null;
  onContinue: () => void;
  onSave: (intent: EditorSaveAction) => void;
}) {
  const busy = blocked || submitting || mediaBusy;

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      {mediaNote ? (
        <p className="max-w-md rounded-box bg-cream px-5 py-4 text-center text-sm leading-6 text-body">
          {mediaNote}
        </p>
      ) : null}
      {submitError || hint || (blocked && error) ? (
        <p
          role={submitError ? "alert" : undefined}
          className={`text-sm ${
            submitError || (!hint && blocked)
              ? "font-medium text-clay-dark"
              : "text-mute"
          }`}
        >
          {submitError || hint || error}
        </p>
      ) : null}
      {step === 4 && !live ? (
        <p className="max-w-sm text-sm text-mute">
          Not public yet. Save as draft keeps this profile off Find.
        </p>
      ) : null}
      {step < 4 ? (
        <Button type="button" disabled={busy} onClick={onContinue}>
          Continue →
        </Button>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actions.draft ? (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => onSave("draft")}
            >
              {submitting && saveIntent === "draft" ? "Saving…" : "Save as draft"}
            </Button>
          ) : null}
          {actions.publish ? (
            <Button type="button" disabled={busy} onClick={() => onSave("publish")}>
              {submitting && saveIntent === "publish"
                ? "Publishing…"
                : "Publish profile →"}
            </Button>
          ) : null}
          {actions.saveChanges ? (
            <Button type="button" disabled={busy} onClick={() => onSave("save")}>
              {submitting && saveIntent === "save"
                ? "Saving…"
                : "Save changes →"}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
