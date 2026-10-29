"use client";

import { useState } from "react";
import { VoicePromptSheet } from "@/components/join/VoicePromptSheet";
import { VoicePromptCard } from "@/components/profile/VoicePromptCard";
import { UploadedStatus } from "@/components/join/UploadedStatus";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { buttonClass } from "@/components/ui/styles";
import { formatRecordClock } from "@/lib/join/record-video";
import { VOICE_MAX_SECONDS } from "@/lib/join/voice";

export function VoicePromptEditor({
  name,
  prompt,
  audioUrl,
  busy,
  disabled,
  onSave,
  onRemove,
}: {
  name: string;
  prompt: string;
  audioUrl: string | null;
  busy: boolean;
  disabled?: boolean;
  onSave: (input: { file: File | null; prompt: string }) => Promise<void>;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const saved = Boolean(audioUrl && prompt.trim());
  const limit = formatRecordClock(VOICE_MAX_SECONDS);

  return (
    <section className="space-y-3">
      <Eyebrow>Voice prompt</Eyebrow>
      <p className="text-sm leading-6 text-mute">
        Up to {limit}. A picture plus this or an intro video publishes your profile.
        You can keep all three.
      </p>
      {saved && audioUrl ? (
        <div className="space-y-3">
          <UploadedStatus label="Voice prompt saved" />
          <VoicePromptCard name={name} prompt={prompt} src={audioUrl} />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={buttonClass("secondary")}
              disabled={disabled || busy}
              onClick={() => setOpen(true)}
            >
              Re-record
            </button>
            <button
              type="button"
              className={buttonClass("secondary")}
              disabled={disabled || busy}
              onClick={onRemove}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <button
            type="button"
            className={buttonClass("secondary")}
            disabled={disabled || busy}
            onClick={() => setOpen(true)}
          >
            Add voice prompt
          </button>
        </div>
      )}
      <VoicePromptSheet
        open={open}
        initialPrompt={prompt}
        hasExisting={saved}
        busy={busy}
        onClose={() => setOpen(false)}
        onSave={async (input) => {
          await onSave(input);
          setOpen(false);
        }}
      />
    </section>
  );
}
