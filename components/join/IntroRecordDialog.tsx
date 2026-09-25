import type { RefObject } from "react";
import type { IntroRecordPhase } from "@/components/join/useIntroRecorder";
import { formatRecordClock } from "@/lib/join/record-video";

const offerButton =
  "rounded-full border border-line bg-paper px-5 py-2.5 text-sm font-medium hover:border-ink/20 disabled:opacity-60";
const primaryButton =
  "rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-paper hover:bg-clay-dark disabled:opacity-60";

export function IntroRecordDialog({
  dialogRef,
  liveRef,
  titleId,
  phase,
  error,
  elapsed,
  reviewUrl,
  sizeNote,
  limitLabel,
  onStart,
  onStop,
  onUse,
  onAgain,
  onClose,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>;
  liveRef: RefObject<HTMLVideoElement | null>;
  titleId: string;
  phase: Exclude<IntroRecordPhase, "closed">;
  error: string;
  elapsed: number;
  reviewUrl: string | null;
  sizeNote: boolean;
  limitLabel: string;
  onStart: () => void;
  onStop: () => void;
  onUse: () => void;
  onAgain: () => void;
  onClose: () => void;
}) {
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-auto w-[min(calc(100%-2rem),28rem)] rounded-[1.75rem] border-0 bg-paper p-6 text-ink shadow-[0_24px_70px_rgba(27,39,68,0.18)] backdrop:bg-ink/40"
    >
      <h2 id={titleId} className="font-display text-3xl tracking-tight">
        Record intro
      </h2>
      <p className="mt-2 text-sm leading-6 text-mute">
        Up to {limitLabel}. Look at the camera and say hello. You can still
        choose a video file instead.
      </p>
      {phase === "review" && reviewUrl ? (
        <video
          src={reviewUrl}
          controls
          playsInline
          className="mt-4 aspect-video w-full rounded-2xl bg-ink object-cover"
        />
      ) : (
        <video
          ref={liveRef}
          muted
          playsInline
          autoPlay
          className="mt-4 aspect-video w-full rounded-2xl bg-ink object-cover"
        />
      )}
      <p className="mt-3 text-sm text-mute" aria-live="polite">
        {phase === "starting"
          ? "Opening camera…"
          : `${formatRecordClock(elapsed)} / ${limitLabel}`}
      </p>
      {sizeNote ? (
        <p className="mt-2 text-sm text-mute">
          Stopped so the recording stays under the upload limit.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-3 text-sm text-clay-dark">
          {error}
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-3">
        {phase === "ready" && !error ? (
          <button type="button" onClick={onStart} className={primaryButton}>
            Start recording
          </button>
        ) : null}
        {phase === "recording" ? (
          <button type="button" onClick={onStop} className={primaryButton}>
            Stop
          </button>
        ) : null}
        {phase === "review" ? (
          <button type="button" onClick={onUse} className={primaryButton}>
            Use this intro
          </button>
        ) : null}
        {phase === "review" || (phase === "ready" && error) ? (
          <button type="button" onClick={onAgain} className={offerButton}>
            Record again
          </button>
        ) : null}
        <button type="button" onClick={onClose} className={offerButton}>
          {phase === "review" ? "Discard" : "Close"}
        </button>
      </div>
    </dialog>
  );
}
