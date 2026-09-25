"use client";

import { useId } from "react";
import { IntroRecordDialog } from "@/components/join/IntroRecordDialog";
import { useIntroRecorder } from "@/components/join/useIntroRecorder";
import { INTRO_MAX_SECONDS, formatRecordClock } from "@/lib/join/record-video";

const offerButton =
  "rounded-full border border-line bg-paper px-5 py-2.5 text-sm font-medium hover:border-ink/20 disabled:opacity-60";

export function IntroRecorder({
  disabled,
  onFile,
}: {
  disabled: boolean;
  onFile: (file: File) => void;
}) {
  const titleId = useId();
  const recorder = useIntroRecorder(onFile);
  if (!recorder.supported && recorder.phase === "closed") return null;

  const limitLabel = formatRecordClock(INTRO_MAX_SECONDS);

  return (
    <div className="space-y-3">
      <div className="text-center">
        <button
          type="button"
          disabled={disabled || recorder.phase !== "closed"}
          aria-haspopup="dialog"
          onClick={recorder.open}
          className={offerButton}
        >
          Record intro
        </button>
        <p className="mt-2 text-sm text-mute">
          Up to {limitLabel}. Choosing a file still works.
        </p>
      </div>
      <IntroRecordDialog
        dialogRef={recorder.dialogRef}
        liveRef={recorder.liveRef}
        titleId={titleId}
        phase={recorder.phase === "closed" ? "ready" : recorder.phase}
        error={recorder.error}
        elapsed={recorder.elapsed}
        reviewUrl={recorder.reviewUrl}
        sizeNote={recorder.sizeNote}
        limitLabel={limitLabel}
        onStart={recorder.startRecording}
        onStop={recorder.finishRecording}
        onUse={recorder.useRecording}
        onAgain={recorder.open}
        onClose={recorder.close}
      />
    </div>
  );
}
