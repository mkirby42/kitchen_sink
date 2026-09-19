"use client";

import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { JoinDraft } from "@/lib/join/types";
import { uploadJoinMedia } from "@/lib/join/submit";
import { createClient } from "@/lib/supabase/client";

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export function JoinStep2({
  userId,
  draft,
  setDraft,
}: {
  userId: string;
  draft: JoinDraft;
  setDraft: Dispatch<SetStateAction<JoinDraft>>;
}) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState({ photo: false, video: false });
  const [error, setError] = useState("");

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

  async function chooseFile(kind: "photo" | "video", file?: File) {
    if (!file) return;

    const maxBytes = kind === "photo" ? 5 * 1024 * 1024 : 50 * 1024 * 1024;
    const allowedTypes = kind === "photo" ? PHOTO_TYPES : VIDEO_TYPES;
    if (!allowedTypes.includes(file.type)) {
      setError(
        kind === "photo"
          ? "Choose a JPEG, PNG, WebP, or GIF photo."
          : "Choose an MP4, WebM, or QuickTime video.",
      );
      return;
    }
    if (file.size > maxBytes) {
      setError(
        `${kind === "photo" ? "Photo" : "Video"} must be ${
          kind === "photo" ? "5MB" : "50MB"
        } or smaller.`,
      );
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
    } finally {
      setUploading((current) => ({ ...current, [kind]: false }));
    }
  }

  return (
    <div className="space-y-10">
      <section className="grid items-center gap-6 sm:grid-cols-[12rem_1fr]">
        <label className="group grid size-48 cursor-pointer place-items-center overflow-hidden rounded-full border-2 border-dashed border-clay/50 bg-cream text-center text-sm font-semibold text-clay hover:border-clay">
          {photoPreview ? (
            // Blob previews cannot use next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoPreview}
              alt="Selected profile preview"
              className="size-full object-cover"
            />
          ) : (
            <span className="px-6">
              {uploading.photo ? "Uploading photo…" : "Choose a photo…"}
            </span>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploading.photo}
            onChange={(event) => {
              void chooseFile("photo", event.target.files?.[0]);
              event.target.value = "";
            }}
            className="sr-only"
          />
        </label>
        <div>
          <h2 className="font-display text-2xl">Your profile photo</h2>
          <p className="mt-2 leading-7 text-mute">
            A clear, well-lit headshot — just you, looking at the camera — works
            best.
          </p>
          {draft.photoKey ? (
            <p className="mt-3 text-sm font-semibold text-clay">Photo uploaded.</p>
          ) : null}
        </div>
      </section>

      <section className="grid items-center gap-6 border-t border-line pt-10 sm:grid-cols-[18rem_1fr]">
        {videoPreview ? (
          <div>
            <video
              src={videoPreview}
              controls
              className="aspect-video w-full rounded-2xl bg-ink object-contain"
            />
            <label className="mt-2 block cursor-pointer text-center text-sm font-semibold text-clay hover:text-clay-dark">
              {uploading.video ? "Uploading video…" : "Choose another video"}
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                disabled={uploading.video}
                onChange={(event) => {
                  void chooseFile("video", event.target.files?.[0]);
                  event.target.value = "";
                }}
                className="sr-only"
              />
            </label>
          </div>
        ) : (
          <label className="group flex aspect-video cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-clay/50 bg-cream text-center text-sm font-semibold text-clay hover:border-clay">
            <span className="px-6">
              {uploading.video ? "Uploading video…" : "Choose an intro video…"}
            </span>
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              disabled={uploading.video}
              onChange={(event) => {
                void chooseFile("video", event.target.files?.[0]);
                event.target.value = "";
              }}
              className="sr-only"
            />
          </label>
        )}
        <div>
          <h2 className="font-display text-2xl">Your intro video</h2>
          <p className="mt-2 leading-7 text-mute">
            One short intro clip. We&apos;ll play it as uploaded on your public
            profile — no editing.
          </p>
          <p className="mt-2 text-sm text-mute">MP4, WebM, or MOV · up to 50MB</p>
          {draft.videoKey ? (
            <p className="mt-3 text-sm font-semibold text-clay">Video uploaded.</p>
          ) : null}
        </div>
      </section>

      {error ? (
        <p role="alert" className="rounded-2xl bg-cream px-5 py-4 text-sm text-clay-dark">
          {error}
        </p>
      ) : null}
    </div>
  );
}
