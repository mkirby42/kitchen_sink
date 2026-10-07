"use client";

import { useRef } from "react";
import { buttonClass, fieldLabelClass } from "@/components/ui/styles";

export function MediaSlot({
  kind,
  preview,
  uploaded,
  uploading,
  busyLabel,
  accept,
  helpers,
  onFile,
}: {
  kind: "photo" | "video";
  preview: string | null;
  uploaded: boolean;
  uploading: boolean;
  busyLabel?: string;
  accept: string;
  helpers: string[];
  onFile: (file?: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const noun = kind === "photo" ? "photo" : "video";

  return (
    <section className="space-y-3">
      {kind === "video" ? (
        <p className={fieldLabelClass}>Intro video</p>
      ) : null}
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label={`Choose a ${noun}`}
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="grid size-[4.5rem] shrink-0 place-items-center overflow-hidden rounded-full border border-dashed border-clay/45 bg-cream disabled:opacity-60"
        >
          {preview ? (
            kind === "photo" ? (
              // Blob previews cannot use next/image.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Selected profile preview"
                className="size-full object-cover"
              />
            ) : (
              <video
                src={preview}
                muted
                playsInline
                className="size-full object-cover"
              />
            )
          ) : (
            <span className="text-2xl text-clay/70" aria-hidden>
              {kind === "photo" ? "+" : "▶"}
            </span>
          )}
        </button>
        <div>
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className={buttonClass("secondary")}
          >
            {uploading
              ? (busyLabel ?? `Uploading ${noun}…`)
              : preview
                ? `Change ${noun}…`
                : `Choose a ${noun}…`}
          </button>
          <p className="mt-2 text-sm text-mute">
            {uploaded
              ? `${kind === "photo" ? "Photo" : "Video"} uploaded.`
              : `No ${noun} chosen yet.`}
          </p>
        </div>
      </div>
      {helpers.map((text) => (
        <p
          key={text}
          className="rounded-2xl bg-cream px-5 py-4 text-center text-sm leading-6 text-mute"
        >
          {text}
        </p>
      ))}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={uploading}
        onChange={(event) => {
          onFile(event.target.files?.[0]);
          event.target.value = "";
        }}
        className="sr-only"
      />
    </section>
  );
}
