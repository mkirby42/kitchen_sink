"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  INTRO_AUDIO_BITS_PER_SECOND,
  INTRO_MAX_SECONDS,
  INTRO_VIDEO_BITS_PER_SECOND,
  acquireIntroCamera,
  canRecordIntro,
  introRecordingFile,
  preferredRecorderMime,
  recordErrorMessage,
  recordingFileType,
  shouldStopForSize,
} from "@/lib/join/record-video";

export type IntroRecordPhase = "closed" | "starting" | "ready" | "recording" | "review";

export function useIntroRecorder(onFile: (file: File) => void) {
  const supported = useSyncExternalStore(
    () => () => {},
    () => canRecordIntro(),
    () => false,
  );
  const [phase, setPhase] = useState<IntroRecordPhase>("closed");
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [reviewUrl, setReviewUrl] = useState<string | null>(null);
  const [sizeNote, setSizeNote] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const liveRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const bytesRef = useRef(0);
  const stoppingRef = useRef(false);
  const sizeStopRef = useRef(false);
  const fileTypeRef = useRef<"video/webm" | "video/mp4" | null>(null);
  const pendingRef = useRef<File | null>(null);
  const timerRef = useRef<number | null>(null);
  const sessionRef = useRef(0);
  const reviewUrlRef = useRef<string | null>(null);

  function stopTimer() {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function stopTracks() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (liveRef.current) liveRef.current.srcObject = null;
  }

  function releaseStream() {
    stopTimer();
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.ondataavailable = null;
      recorder.stop();
    }
    stopTracks();
  }

  function setReview(url: string | null) {
    if (reviewUrlRef.current) URL.revokeObjectURL(reviewUrlRef.current);
    reviewUrlRef.current = url;
    setReviewUrl(url);
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (phase !== "closed" && !dialog.open) dialog.showModal();
    if (phase === "closed" && dialog.open) dialog.close();
  }, [phase]);

  useEffect(() => {
    return () => {
      sessionRef.current += 1;
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (reviewUrlRef.current) URL.revokeObjectURL(reviewUrlRef.current);
    };
  }, []);

  async function attachCamera(session: number) {
    const result = await acquireIntroCamera(
      (constraints) => navigator.mediaDevices.getUserMedia(constraints),
      () => sessionRef.current === session,
    );
    if (sessionRef.current !== session || !result.stream) {
      if (!result.stream && result.error && sessionRef.current === session) {
        setError(recordErrorMessage(result.error));
        setPhase("ready");
      }
      return;
    }
    const stream = result.stream;
    streamRef.current = stream;
    if (liveRef.current) {
      liveRef.current.srcObject = stream;
      await liveRef.current.play().catch(() => undefined);
    }
    if (sessionRef.current !== session) {
      stream.getTracks().forEach((track) => track.stop());
      if (streamRef.current === stream) streamRef.current = null;
      return;
    }
    setPhase("ready");
  }

  function open() {
    const session = sessionRef.current + 1;
    sessionRef.current = session;
    setError("");
    setElapsed(0);
    setSizeNote(false);
    pendingRef.current = null;
    setReview(null);
    releaseStream();
    setPhase("starting");
    void attachCamera(session);
  }

  function close() {
    sessionRef.current += 1;
    const recorder = recorderRef.current;
    if (recorder) recorder.onstop = null;
    releaseStream();
    pendingRef.current = null;
    setReview(null);
    setPhase("closed");
  }

  function finishRecording() {
    if (stoppingRef.current) return;
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    stoppingRef.current = true;
    stopTimer();
    recorder.stop();
  }

  function startRecording() {
    const stream = streamRef.current;
    if (!stream) return;
    const mime = preferredRecorderMime((type) => MediaRecorder.isTypeSupported(type));
    const fileType = mime ? recordingFileType(mime) : null;
    if (!mime || !fileType) {
      setError(
        "This browser can't record a video we can upload. Choose a video file instead.",
      );
      return;
    }
    fileTypeRef.current = fileType;
    chunksRef.current = [];
    bytesRef.current = 0;
    stoppingRef.current = false;
    sizeStopRef.current = false;
    setError("");
    setSizeNote(false);

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, {
        mimeType: mime,
        videoBitsPerSecond: INTRO_VIDEO_BITS_PER_SECOND,
        audioBitsPerSecond: INTRO_AUDIO_BITS_PER_SECOND,
      });
    } catch {
      try {
        recorder = new MediaRecorder(stream, { mimeType: mime });
      } catch {
        setError("Couldn't start recording. Choose a video file instead.");
        return;
      }
    }

    const generation = sessionRef.current;
    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size < 1) return;
      chunksRef.current.push(event.data);
      bytesRef.current += event.data.size;
      if (shouldStopForSize(bytesRef.current)) {
        sizeStopRef.current = true;
        finishRecording();
      }
    };
    recorder.onstop = () => {
      if (sessionRef.current !== generation) return;
      recorderRef.current = null;
      stopTimer();
      stopTracks();
      const type = fileTypeRef.current ?? "video/webm";
      const blob = new Blob(chunksRef.current, { type });
      const file = introRecordingFile(blob);
      if (!file) {
        setError(
          "That recording was empty. Try again, or choose a video file instead.",
        );
        setPhase("ready");
        return;
      }
      pendingRef.current = file;
      setSizeNote(sizeStopRef.current);
      setReview(URL.createObjectURL(file));
      setPhase("review");
    };
    recorder.start(1000);
    const started = Date.now();
    timerRef.current = window.setInterval(() => {
      const seconds = (Date.now() - started) / 1000;
      setElapsed(seconds);
      if (seconds >= INTRO_MAX_SECONDS) finishRecording();
    }, 200);
    setElapsed(0);
    setPhase("recording");
  }

  function useRecording() {
    const file = pendingRef.current;
    if (!file) return;
    close();
    onFile(file);
  }

  return {
    supported,
    phase,
    error,
    elapsed,
    reviewUrl,
    sizeNote,
    dialogRef,
    liveRef,
    open,
    close,
    startRecording,
    finishRecording,
    useRecording,
  };
}
