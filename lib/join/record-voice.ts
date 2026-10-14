const MIME_CANDIDATES = [
  "audio/mp4",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/aac",
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/ogg",
] as const;

const UPLOAD_TYPES = ["audio/mp4", "audio/aac", "audio/webm", "audio/ogg"] as const;

export type VoiceUploadType = (typeof UPLOAD_TYPES)[number];

const EXTENSIONS: Record<VoiceUploadType, string> = {
  "audio/mp4": "m4a",
  "audio/aac": "aac",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
};

export function preferredVoiceMime(isSupported: (mime: string) => boolean) {
  return MIME_CANDIDATES.find((mime) => isSupported(mime)) ?? null;
}

export function voiceUploadType(mime: string): VoiceUploadType | null {
  const base = mime.split(";")[0]?.trim().toLowerCase() ?? "";
  if (base === "audio/mp4" || base === "audio/x-m4a" || base === "audio/m4a") {
    return "audio/mp4";
  }
  if ((UPLOAD_TYPES as readonly string[]).includes(base)) return base as VoiceUploadType;
  return null;
}

export function voiceRecordingFile(
  blob: Blob,
  requestedMime: string,
  now = Date.now(),
) {
  const type = voiceUploadType(blob.type) ?? voiceUploadType(requestedMime);
  if (!type || blob.size < 1) return null;
  return new File([blob], `voice-${now}.${EXTENSIONS[type]}`, { type });
}

export function voiceRecordError(error: unknown) {
  const name =
    error && typeof error === "object" && "name" in error
      ? String(error.name)
      : "";
  if (
    name === "NotAllowedError" ||
    name === "PermissionDeniedError" ||
    name === "SecurityError"
  ) {
    return "Microphone access was blocked. Allow it in the browser, or upload an audio file instead.";
  }
  if (
    name === "NotFoundError" ||
    name === "DevicesNotFoundError" ||
    name === "OverconstrainedError"
  ) {
    return "No microphone was found. Upload an audio file instead.";
  }
  return "Couldn't start recording. Upload an audio file instead.";
}

type RecordEnv = {
  mediaRecorder?: unknown;
  getUserMedia?: unknown;
  isTypeSupported?: (mime: string) => boolean;
};

export function canRecordVoice(env: RecordEnv = browserVoiceEnv()) {
  return Boolean(
    env.mediaRecorder &&
      env.getUserMedia &&
      env.isTypeSupported &&
      preferredVoiceMime(env.isTypeSupported),
  );
}

export function browserVoiceEnv(): RecordEnv {
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

export const VOICE_AUDIO_ATTEMPTS: MediaStreamConstraints[] = [
  { audio: { echoCancellation: true, noiseSuppression: true } },
  { audio: true },
];
