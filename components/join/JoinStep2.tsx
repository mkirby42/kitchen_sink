"use client";

import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { JoinDraft } from "@/lib/join/types";
import { prepareJoinPhoto } from "@/lib/join/compress-photo";
import {
  PHOTO_ACCEPT,
  PHOTO_UNREADABLE,
  VIDEO_ACCEPT,
  joinMediaRejection,
  uploadFailureMessage,
} from "@/lib/join/media";
import { uploadJoinMedia } from "@/lib/join/submit";
import { createClient } from "@/lib/supabase/client";
import { storagePublicUrl } from "@/lib/therapists/display";
import { IntroRecorder } from "./IntroRecorder";
import { MediaSlot } from "./MediaSlot";
import { UploadHelp } from "./UploadHelp";

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
  const [preparingPhoto, setPreparingPhoto] = useState(false);
  const requestRef = useRef({ photo: 0, video: 0 });
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
    onBusyChange?.(uploading.photo || uploading.video || preparingPhoto);
    return () => onBusyChange?.(false);
  }, [onBusyChange, preparingPhoto, uploading.photo, uploading.video]);

  function fail(message: string) {
    setError(message);
    setUploadTrouble((count) => count + 1);
  }

  async function chooseFile(kind: "photo" | "video", file?: File) {
    if (!file) return;
    const request = ++requestRef.current[kind];
    const isCurrent = () => requestRef.current[kind] === request;
    setError("");

    let ready = file;
    if (kind === "photo") {
      setPreparingPhoto(true);
      try {
        ready = await prepareJoinPhoto(file);
      } catch (prepareError) {
        if (!isCurrent()) return;
        fail(
          prepareError instanceof Error ? prepareError.message : PHOTO_UNREADABLE,
        );
        setUploading((state) => ({ ...state, [kind]: false }));
        return;
      } finally {
        if (isCurrent()) setPreparingPhoto(false);
      }
    }

    if (!isCurrent()) return;
    const fileError = joinMediaRejection(kind, ready);
    if (fileError) {
      fail(fileError);
      setUploading((state) => ({ ...state, [kind]: false }));
      return;
    }

    const previewUrl = URL.createObjectURL(ready);
    if (kind === "photo") setPhotoPreview(previewUrl);
    else setVideoPreview(previewUrl);

    setDraft((current) => ({
      ...current,
      [kind === "photo" ? "photoKey" : "videoKey"]: null,
    }));
    setUploading((current) => ({ ...current, [kind]: true }));

    try {
      const path = await uploadJoinMedia(createClient(), userId, kind, ready);
      if (!isCurrent()) return;
      setDraft((draft) => ({
        ...draft,
        [kind === "photo" ? "photoKey" : "videoKey"]: path,
      }));
    } catch (uploadError) {
      if (!isCurrent()) return;
      fail(uploadFailureMessage(kind, uploadError));
    } finally {
      if (isCurrent()) setUploading((state) => ({ ...state, [kind]: false }));
    }
  }

  return (
    <div className="space-y-10">
      <MediaSlot
        kind="photo"
        preview={photoPreview}
        uploaded={Boolean(draft.photoKey)}
        uploading={uploading.photo || preparingPhoto}
        busyLabel={preparingPhoto ? "Resizing photo…" : undefined}
        accept={PHOTO_ACCEPT}
        helpers={[
          "A clear, well-lit headshot — just you, looking at the camera — works best.",
          "JPEG, PNG, WebP, or GIF · up to 5MB. This is the photo clients see first on your profile.",
          "Large photos are resized in your browser so they can upload.",
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

      <IntroRecorder
        disabled={uploading.video}
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
