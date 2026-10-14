"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MicIcon, PencilIcon } from "@/components/join/VoicePromptIcons";
import { useVoiceRecorder } from "@/components/join/useVoiceRecorder";
import { formatRecordClock } from "@/lib/join/record-video";
import {
  VOICE_ACCEPT,
  VOICE_MAX_SECONDS,
  VOICE_PROMPT_MAX,
  prepareVoiceFile,
  readVoiceDuration,
  voiceFileError,
  voiceLengthError,
  voiceTitleError,
} from "@/lib/join/voice";

export function VoicePromptSheet({
  open,
  initialPrompt,
  hasExisting,
  busy,
  onClose,
  onSave,
}: {
  open: boolean;
  initialPrompt: string;
  hasExisting: boolean;
  busy: boolean;
  onClose: () => void;
  onSave: (input: { file: File | null; prompt: string }) => Promise<void>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const promptId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const recorder = useVoiceRecorder();
  const resetRecording = recorder.reset;
  const [prompt, setPrompt] = useState(initialPrompt);
  const wasOpen = useRef(false);
  const limit = formatRecordClock(VOICE_MAX_SECONDS);

  useEffect(() => {
    if (open && !wasOpen.current) {
      setPrompt(initialPrompt);
      resetRecording();
    }
    wasOpen.current = open;
  }, [open, initialPrompt, resetRecording]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  async function chooseFile(file?: File) {
    if (!file) return;
    const typed = prepareVoiceFile(file) ?? file;
    const typeError = voiceFileError(typed);
    if (typeError) {
      recorder.setError(typeError);
      return;
    }
    const seconds = await readVoiceDuration(typed);
    const lengthError = voiceLengthError(seconds, typed.size);
    if (lengthError) {
      recorder.setError(lengthError);
      return;
    }
    const ready = prepareVoiceFile(typed);
    if (!ready) {
      recorder.setError("Choose an audio file.");
      return;
    }
    recorder.adoptFile(ready);
  }

  async function save() {
    const titleError = voiceTitleError(prompt);
    if (titleError) {
      recorder.setError(titleError);
      return;
    }
    const file = recorder.fileRef.current;
    if (!file && !hasExisting) {
      recorder.setError("Record a voice prompt, or upload an audio file.");
      return;
    }
    try {
      await onSave({ file, prompt: prompt.trim() });
    } catch (error) {
      recorder.setError(
        error instanceof Error ? error.message : "Unable to save that recording.",
      );
    }
  }

  const clock = formatRecordClock(recorder.elapsed);
  const hasTake = recorder.phase === "review" || (hasExisting && recorder.phase === "idle");
  const canSave = Boolean(prompt.trim()) && hasTake && !busy;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      className="m-0 mt-auto mb-0 w-full max-w-lg rounded-t-[1.75rem] border-0 bg-paper p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-body shadow-overlay backdrop:bg-black/40 sm:m-auto sm:rounded-card sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          className="text-sm font-semibold text-ink disabled:opacity-50"
          disabled={busy}
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="button"
          className="text-sm font-semibold text-ink disabled:text-mute"
          disabled={!canSave}
          onClick={() => void save()}
        >
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
      <h2
        id={titleId}
        className="mt-5 text-center font-display text-[2rem] leading-tight font-normal tracking-tight text-black"
      >
        Add Voice Prompt
      </h2>
      <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-6 text-mute">
        Record a short hello in your own voice. It plays on your profile. Up to {limit}.
      </p>
      <label htmlFor={promptId} className="mt-5 block">
        <span className="sr-only">Voice prompt title</span>
        <span className="flex items-center gap-3 rounded-box border border-line bg-paper px-4 py-3">
          <input
            id={promptId}
            value={prompt}
            maxLength={VOICE_PROMPT_MAX}
            placeholder="A short line clients read before they press play"
            onChange={(event) => setPrompt(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-base text-black outline-none placeholder:text-mute/70"
          />
          <PencilIcon />
        </span>
      </label>
      <div className="mt-4 flex min-h-36 flex-col items-center justify-center rounded-box border border-line px-4 py-8">
        {recorder.phase === "review" && recorder.previewUrl ? (
          <audio src={recorder.previewUrl} controls playsInline className="w-full" />
        ) : (
          <p className="font-sans text-lg tracking-wide text-mute" aria-live="polite">
            {clock} / {limit}
          </p>
        )}
      </div>
      {recorder.supported ? (
        <div className="mt-6 flex flex-col items-center">
          <button
            type="button"
            disabled={busy}
            aria-label={recorder.phase === "recording" ? "Stop recording" : "Start recording"}
            onClick={() =>
              recorder.phase === "recording" ? recorder.stop() : void recorder.start()
            }
            className="grid size-20 place-items-center rounded-full bg-ink text-paper shadow-card hover:bg-ink-dark disabled:opacity-50"
          >
            {recorder.phase === "recording" ? (
              <span className="size-6 rounded-[4px] bg-paper" aria-hidden />
            ) : (
              <MicIcon />
            )}
          </button>
          <p className="mt-3 text-sm text-mute">
            {recorder.phase === "recording"
              ? "Tap to stop"
              : recorder.phase === "review"
                ? "Tap to re-record"
                : "Tap to start recording"}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-center text-sm text-mute">
          This browser can&apos;t record from the microphone. Upload an audio file instead.
        </p>
      )}
      <div className="mt-4 text-center">
        <button
          type="button"
          className="text-sm font-semibold text-ink underline"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          Upload an audio file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={VOICE_ACCEPT}
          className="sr-only"
          onChange={(event) => {
            void chooseFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>
      {recorder.error ? (
        <p role="alert" className="mt-4 text-center text-sm font-medium text-clay-dark">
          {recorder.error}
        </p>
      ) : null}
    </dialog>
  );
}
