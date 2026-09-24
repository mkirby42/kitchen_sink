"use client";

import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { JoinDraft } from "@/lib/join/types";
import { mediaFileError, PHOTO_ACCEPT, VIDEO_ACCEPT } from "@/lib/join/media";
import { uploadJoinMedia } from "@/lib/join/submit";
import { createClient } from "@/lib/supabase/client";
import { storagePublicUrl } from "@/lib/therapists/display";
import { UploadHelp } from "./UploadHelp";

function MediaSlot({
  kind,
  preview,
  uploaded,
  uploading,
  accept,
  helpers,
  onFile,
}: {
  kind: "photo" | "video";
  preview: string | null;
  uploaded: boolean;
  uploading: boolean;
  accept: string;
  helpers: string[];
  onFile: (file?: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const noun = kind === "photo" ? "photo" : "video";

  return (
    <section className="space-y-3">
      {kind === "video" ? (
        <p className="text-xs font-semibold tracking-[0.16em] text-mute uppercase">
          Intro video
        </p>
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
            className="rounded-full border border-line bg-paper px-5 py-2.5 text-sm font-medium hover:border-ink/20 disabled:opacity-60"
          >
            {uploading
              ? `Uploading ${noun}…`
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

export function JoinStep2({
  userId,
  draft,
  setDraft,
  onBusyChange,
}: {
  userId: string;
  draft: JoinDraft;
  setDraft: Dispatch<SetStateAction<JoinDraft>>;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    () => storagePublicUrl("photos", draft.photoKey),
  );
  const [videoPreview, setVideoPreview] = useState<string | null>(
    () => storagePublicUrl("videos", draft.videoKey),
  );
  const [uploading, setUploading] = useState({ photo: false, video: false });
  const [error, setError] = useState("");
  const [uploadTrouble, setUploadTrouble] = useState(0);

  useEffect(
    () => () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    },
    [photoPreview],
  );

  useEffect(
    () => () => {
      if (videoPreview) URL.revokeObjectURL(videoPreview);
    },
    [videoPreview],
  );

  useEffect(() => {
    onBusyChange?.(uploading.photo || uploading.video);
    return () => onBusyChange?.(false);
  }, [onBusyChange, uploading.photo, uploading.video]);

  async function chooseFile(kind: "photo" | "video", file?: File) {
    if (!file) return;

    const fileError = mediaFileError(kind, file);
    if (fileError) {
      setError(fileError);
      return;
    }

    setError("");
    const previewUrl = URL.createObjectURL(file);
    if (kind === "photo") setPhotoPreview(previewUrl);
    else setVideoPreview(previewUrl);

    setDraft((current) => ({
      ...current,
      [kind === "photo" ? "photoKey" : "videoKey"]: null,
    }));
    setUploading((current) => ({ ...current, [kind]: true }));

    try {
      const path = await uploadJoinMedia(createClient(), userId, kind, file);
      setDraft((current) => ({
        ...current,
        [kind === "photo" ? "photoKey" : "videoKey"]: path,
      }));
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : `Unable to upload ${kind}.`,
      );
      setUploadTrouble((count) => count + 1);
    } finally {
      setUploading((current) => ({ ...current, [kind]: false }));
    }
  }

  return (
    <div className="space-y-10">
      <MediaSlot
        kind="photo"
        preview={photoPreview}
        uploaded={Boolean(draft.photoKey)}
        uploading={uploading.photo}
        accept={PHOTO_ACCEPT}
        helpers={[
          "A clear, well-lit headshot — just you, looking at the camera — works best.",
          "JPEG, PNG, WebP, or GIF · up to 5MB. This is the photo clients see first on your profile.",
        ]}
        onFile={(file) => void chooseFile("photo", file)}
      />

      <MediaSlot
        kind="video"
        preview={videoPreview}
        uploaded={Boolean(draft.videoKey)}
        uploading={uploading.video}
        accept={VIDEO_ACCEPT}
        helpers={[
          "Optional. One short intro clip. We'll play it as uploaded on your public profile — no editing.",
          "MP4, WebM, or MOV · up to 50MB.",
        ]}
        onFile={(file) => void chooseFile("video", file)}
      />

      {error ? (
        <p role="alert" className="rounded-2xl bg-cream px-5 py-4 text-sm text-clay-dark">
          {error}
        </p>
      ) : null}
      <UploadHelp troubleToken={uploadTrouble} />
    </div>
  );
}
