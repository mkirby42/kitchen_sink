"use client";

import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { JoinDraft } from "@/lib/join/types";
import { uploadJoinMedia } from "@/lib/join/submit";
import {
  prepareVoiceFile,
  readVoiceDuration,
  voiceFileError,
  voiceLengthError,
  voiceUploadFailureMessage,
} from "@/lib/join/voice";
import { createClient } from "@/lib/supabase/client";
import { storagePublicUrl } from "@/lib/therapists/display";

export function useJoinVoiceUpload({
  userId,
  draft,
  setDraft,
  onFail,
  onBegin,
}: {
  userId: string;
  draft: JoinDraft;
  setDraft: Dispatch<SetStateAction<JoinDraft>>;
  onFail: (message: string) => void;
  onBegin: () => void;
}) {
  const [preview, setPreview] = useState<string | null>(() =>
    storagePublicUrl("voice", draft.voiceKey),
  );
  const [uploading, setUploading] = useState(false);
  const requestRef = useRef(0);

  useEffect(
    () => () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  function reject(message: string): never {
    onFail(message);
    throw new Error(message);
  }

  async function save(input: { file: File | null; prompt: string }) {
    const request = ++requestRef.current;
    const isCurrent = () => requestRef.current === request;
    onBegin();

    if (!input.file) {
      setDraft((current) => ({ ...current, voicePrompt: input.prompt }));
      return;
    }

    const prepared = prepareVoiceFile(input.file);
    if (!prepared) reject(voiceFileError(input.file) ?? "Choose an audio file.");
    const typeError = voiceFileError(prepared);
    if (typeError) reject(typeError);
    const seconds = await readVoiceDuration(prepared);
    if (!isCurrent()) return;
    const lengthError = voiceLengthError(seconds, prepared.size);
    if (lengthError) reject(lengthError);

    const previousKey = draft.voiceKey;
    const previousPrompt = draft.voicePrompt;
    setPreview(URL.createObjectURL(prepared));
    setDraft((current) => ({ ...current, voiceKey: null, voicePrompt: input.prompt }));
    setUploading(true);
    try {
      const path = await uploadJoinMedia(createClient(), userId, "voice", prepared);
      if (!isCurrent()) return;
      setDraft((current) => ({
        ...current,
        voiceKey: path,
        voicePrompt: input.prompt,
      }));
    } catch (uploadError) {
      if (!isCurrent()) return;
      const message = voiceUploadFailureMessage(uploadError);
      onFail(message);
      setDraft((current) => ({
        ...current,
        voiceKey: previousKey,
        voicePrompt: previousPrompt,
      }));
      setPreview(storagePublicUrl("voice", previousKey));
      throw new Error(message);
    } finally {
      if (isCurrent()) setUploading(false);
    }
  }

  function remove() {
    requestRef.current += 1;
    setPreview(null);
    setDraft((current) => ({ ...current, voiceKey: null, voicePrompt: null }));
  }

  return { preview, uploading, save, remove };
}
