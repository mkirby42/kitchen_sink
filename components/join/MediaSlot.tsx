"use client";

import { useRef } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { buttonClass } from "@/components/ui/styles";
import { UploadedStatus } from "./UploadedStatus";

export function MediaSlot({
  kind,
  uploaded,
  uploading,
  busyLabel,
  accept,
  helpers,
  statusLabel,
  onFile,
  onRemove,
}: {
  kind: "photo" | "video";
  uploaded: boolean;
  uploading: boolean;
  busyLabel?: string;
  accept: string;
  helpers: string[];
  statusLabel: string;
  onFile: (file?: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const noun = kind === "photo" ? "photo" : "video";
  const showUploaded = uploaded && !uploading;

  return (
    <section className="space-y-3">
      {kind === "video" ? <Eyebrow>Intro video</Eyebrow> : null}
      {showUploaded ? (
        <UploadedStatus label={statusLabel} />
      ) : (
        <p className="text-sm text-mute">
          {uploading
            ? (busyLabel ?? `Uploading ${noun}…`)
            : `No ${noun} chosen yet.`}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className={buttonClass("secondary")}
        >
          {uploading
            ? (busyLabel ?? `Uploading ${noun}…`)
            : uploaded
              ? `Replace ${noun}…`
              : `Choose a ${noun}…`}
        </button>
        {uploaded ? (
          <button
            type="button"
            disabled={uploading}
            onClick={onRemove}
            className={buttonClass("secondary")}
          >
            Remove
          </button>
        ) : null}
      </div>
      {helpers.map((text) => (
        <p
          key={text}
          className="rounded-box bg-cream px-5 py-4 text-center text-sm leading-6 text-mute"
        >
          {text}
        </p>
      ))}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={uploading}
        aria-label={`Choose a ${noun}`}
        onChange={(event) => {
          onFile(event.target.files?.[0]);
          event.target.value = "";
        }}
        className="sr-only"
      />
    </section>
  );
}
