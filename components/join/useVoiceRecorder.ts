"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  VOICE_AUDIO_ATTEMPTS,
  canRecordVoice,
  preferredVoiceMime,
  voiceRecordError,
  voiceRecordingFile,
} from "@/lib/join/record-voice";
import { VOICE_MAX_SECONDS } from "@/lib/join/voice";

export type VoiceRecordPhase = "idle" | "recording" | "review";

export function useVoiceRecorder() {
  const supported = useSyncExternalStore(
    () => () => {},
    () => canRecordVoice(),
    () => false,
  );
  const [phase, setPhase] = useState<VoiceRecordPhase>("idle");
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<File | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const sessionRef = useRef(0);
  const previewRef = useRef<string | null>(null);

  function stopTimer() {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function stopTracks() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function setPreview(url: string | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = url;
    setPreviewUrl(url);
  }

  const reset = useCallback(() => {
    sessionRef.current += 1;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.stop();
    }
    recorderRef.current = null;
    stopTimer();
    stopTracks();
    fileRef.current = null;
    chunksRef.current = [];
    setPreview(null);
    setElapsed(0);
    setError("");
    setPhase("idle");
  }, []);

  useEffect(() => {
    return () => {
      sessionRef.current += 1;
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = null;
        recorder.stop();
      }
      if (timerRef.current != null) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  function adoptFile(file: File) {
    sessionRef.current += 1;
    stopTimer();
    stopTracks();
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.stop();
    }
    recorderRef.current = null;
    fileRef.current = file;
    setPreview(URL.createObjectURL(file));
    setElapsed(0);
    setError("");
    setPhase("review");
  }

  async function start() {
    if (!canRecordVoice()) {
      setError("This browser can't record from the microphone. Upload an audio file instead.");
      return;
    }
    const session = sessionRef.current + 1;
    sessionRef.current = session;
    setError("");
    fileRef.current = null;
    setPreview(null);
    stopTracks();

    const getUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    let stream: MediaStream | null = null;
    let lastError: unknown;
    for (const constraints of VOICE_AUDIO_ATTEMPTS) {
      try {
        stream = await getUserMedia(constraints);
        break;
      } catch (recordError) {
        lastError = recordError;
        const name =
          recordError && typeof recordError === "object" && "name" in recordError
            ? String(recordError.name)
            : "";
        if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") {
          break;
        }
      }
    }
    if (sessionRef.current !== session) {
      stream?.getTracks().forEach((track) => track.stop());
      return;
    }
    if (!stream) {
      setError(voiceRecordError(lastError));
      setPhase("idle");
      return;
    }
    streamRef.current = stream;

    const mime = preferredVoiceMime((type) => MediaRecorder.isTypeSupported(type));
    if (!mime) {
      stopTracks();
      setError("This browser can't record a file we can upload. Upload an audio file instead.");
      return;
    }
    mimeRef.current = mime;
    chunksRef.current = [];

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 96_000 });
    } catch {
      try {
        recorder = new MediaRecorder(stream, { mimeType: mime });
      } catch (recordError) {
        stopTracks();
        setError(voiceRecordError(recordError));
        return;
      }
    }

    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      if (sessionRef.current !== session) return;
      recorderRef.current = null;
      stopTimer();
      stopTracks();
      const blob = new Blob(chunksRef.current, {
        type: mimeRef.current ?? "audio/mp4",
      });
      const file = voiceRecordingFile(blob, mimeRef.current ?? "");
      if (!file) {
        setError("That recording was empty. Try again, or upload an audio file instead.");
        setPhase("idle");
        return;
      }
      fileRef.current = file;
      setPreview(URL.createObjectURL(file));
      setPhase("review");
    };

    try {
      recorder.start();
    } catch (recordError) {
      stopTracks();
      setError(voiceRecordError(recordError));
      return;
    }

    const started = Date.now();
    setElapsed(0);
    setPhase("recording");
    timerRef.current = window.setInterval(() => {
      const seconds = (Date.now() - started) / 1000;
      setElapsed(seconds);
      if (seconds >= VOICE_MAX_SECONDS) stop();
    }, 200);
  }

  function stop() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    stopTimer();
    recorder.stop();
  }

  return {
    supported,
    phase,
    error,
    elapsed,
    previewUrl,
    fileRef,
    setError,
    start,
    stop,
    reset,
    adoptFile,
  };
}
