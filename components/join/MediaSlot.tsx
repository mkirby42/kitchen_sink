"use client";

import { useRef } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { buttonClass } from "@/components/ui/styles";

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
      {kind === "video" ? <Eyebrow>Intro video</Eyebrow> : null}
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label={`Choose a ${noun}`}
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="grid size-[4.5rem] shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-cream disabled:opacity-60"
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
            <span className="text-2xl text-clay" aria-hidden>
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
        onChange={(event) => {
          onFile(event.target.files?.[0]);
          event.target.value = "";
        }}
        className="sr-only"
      />
    </section>
  );
}
