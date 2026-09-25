export const INTRO_MAX_SECONDS = 90;
export const INTRO_VIDEO_BITS_PER_SECOND = 1_500_000;
export const INTRO_AUDIO_BITS_PER_SECOND = 96_000;
/** Stop before the 50MB bucket limit so the last chunk still fits. */
export const INTRO_SIZE_STOP_BYTES = 45 * 1024 * 1024;

const MIME_CANDIDATES = [
  "video/webm;codecs=vp8,opus",
  "video/webm;codecs=vp9,opus",
  "video/webm",
  "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
  "video/mp4;codecs=avc1,mp4a",
  "video/mp4",
] as const;

export function preferredRecorderMime(isSupported: (mime: string) => boolean) {
  return MIME_CANDIDATES.find((mime) => isSupported(mime)) ?? null;
}

export function recordingFileType(mime: string): "video/webm" | "video/mp4" | null {
  const base = mime.split(";")[0]?.trim().toLowerCase();
  if (base === "video/webm" || base === "video/mp4") return base;
  return null;
}

export function introRecordingFile(blob: Blob, now = Date.now()) {
  const type = recordingFileType(blob.type);
  if (!type || blob.size < 1) return null;
  const ext = type === "video/mp4" ? "mp4" : "webm";
  return new File([blob], `intro-${now}.${ext}`, { type });
}

export function formatRecordClock(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

export function shouldStopForSize(bytes: number, max = INTRO_SIZE_STOP_BYTES) {
  return bytes >= max;
}

export function isPermissionError(error: unknown) {
  const name =
    error && typeof error === "object" && "name" in error
      ? String(error.name)
      : "";
  return (
    name === "NotAllowedError" ||
    name === "PermissionDeniedError" ||
    name === "SecurityError"
  );
}

export function recordErrorMessage(error: unknown) {
  const name =
    error && typeof error === "object" && "name" in error
      ? String(error.name)
      : "";
  if (isPermissionError(error)) {
    return "Camera or microphone access was blocked. Allow it in the browser, or choose a video file instead.";
  }
  if (
    name === "NotFoundError" ||
    name === "DevicesNotFoundError" ||
    name === "OverconstrainedError"
  ) {
    return "No camera was found. Choose a video file instead.";
  }
  return "Couldn't start recording. Choose a video file instead.";
}

type RecordEnv = {
  mediaRecorder?: unknown;
  getUserMedia?: unknown;
  isTypeSupported?: (mime: string) => boolean;
};

export function canRecordIntro(env: RecordEnv = browserRecordEnv()) {
  return Boolean(
    env.mediaRecorder &&
      env.getUserMedia &&
      env.isTypeSupported &&
      preferredRecorderMime(env.isTypeSupported),
  );
}

export function browserRecordEnv(): RecordEnv {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return {};
  }
  const getUserMedia = navigator.mediaDevices?.getUserMedia?.bind(
    navigator.mediaDevices,
  );
  return {
    mediaRecorder: MediaRecorder,
    getUserMedia,
    isTypeSupported: (mime) => MediaRecorder.isTypeSupported(mime),
  };
}

export const CAMERA_ATTEMPTS: MediaStreamConstraints[] = [
  {
    video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: true,
  },
  { video: true, audio: true },
];

export async function acquireIntroCamera(
  getUserMedia: (constraints: MediaStreamConstraints) => Promise<MediaStream>,
  isCurrent: () => boolean,
) {
  let lastError: unknown;
  for (const constraints of CAMERA_ATTEMPTS) {
    try {
      const stream = await getUserMedia(constraints);
      if (!isCurrent()) {
        stream.getTracks().forEach((track) => track.stop());
        return { stream: null, error: null };
      }
      return { stream, error: null };
    } catch (error) {
      lastError = error;
      if (isPermissionError(error)) break;
    }
  }
  if (!isCurrent()) return { stream: null, error: null };
  return { stream: null, error: lastError };
}
