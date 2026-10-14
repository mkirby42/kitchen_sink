export const VOICE_MAX_SECONDS = 30;
export const VOICE_PROMPT_MAX = 80;
/** 30s of stereo WAV plus a little headroom. Compressed clips are much smaller. */
export const VOICE_MAX_BYTES = 8 * 1024 * 1024;
/** Compressed audio with no readable duration. A real 30s clip fits; a long mp3 does not. */
export const VOICE_UNKNOWN_LENGTH_MAX_BYTES = Math.floor(1.5 * 1024 * 1024);

export const VOICE_TYPES = [
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/ogg",
  "audio/aac",
  "audio/x-m4a",
  "audio/m4a",
  "audio/mp3",
] as const;

export const VOICE_ACCEPT =
  "audio/*,.m4a,.mp3,.wav,.aac,.webm,.ogg,.mp4,audio/mp4,audio/mpeg,audio/webm,audio/wav,audio/aac,audio/ogg";

const EXT_TYPES: Record<string, (typeof VOICE_TYPES)[number]> = {
  m4a: "audio/mp4",
  mp4: "audio/mp4",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  webm: "audio/webm",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  aac: "audio/aac",
};

const TYPE_ALIASES: Record<string, (typeof VOICE_TYPES)[number]> = {
  "audio/mp4": "audio/mp4",
  "audio/x-m4a": "audio/mp4",
  "audio/m4a": "audio/mp4",
  "audio/mp4a-latm": "audio/mp4",
  "audio/aac": "audio/aac",
  "audio/mpeg": "audio/mpeg",
  "audio/mp3": "audio/mpeg",
  "audio/webm": "audio/webm",
  "audio/ogg": "audio/ogg",
  "audio/wav": "audio/wav",
  "audio/x-wav": "audio/wav",
  "audio/wave": "audio/wav",
};

export const VOICE_TYPE_ERROR =
  "Choose an M4A, MP3, WAV, AAC, WebM, or OGG recording.";
export const VOICE_TOO_LARGE = "That recording is over 8MB. Use a shorter clip.";
export const VOICE_TOO_LONG = "Voice prompts can be up to 30 seconds.";
export const VOICE_LENGTH_UNKNOWN =
  "Couldn't check that recording's length. Use a clip under 30 seconds.";
export const VOICE_TITLE_REQUIRED = "Add a short title for your voice prompt.";
export const VOICE_TITLE_TOO_LONG = `Voice prompt titles can be ${VOICE_PROMPT_MAX} characters or fewer.`;

export function normalizeVoiceType(file: { type: string; name: string }) {
  const raw = file.type.split(";")[0]?.trim().toLowerCase() ?? "";
  if (TYPE_ALIASES[raw]) return TYPE_ALIASES[raw];
  // A declared non-audio type stays rejected. Empty and octet-stream fall back to the extension.
  if (raw && raw !== "application/octet-stream") return null;
  const ext = file.name.split(".").pop()?.trim().toLowerCase() ?? "";
  return EXT_TYPES[ext] ?? null;
}

export function voiceFileError(file: { type: string; size: number; name: string }) {
  if (!normalizeVoiceType(file)) return VOICE_TYPE_ERROR;
  if (file.size > VOICE_MAX_BYTES) return VOICE_TOO_LARGE;
  if (file.size < 1) return "That recording was empty.";
  return null;
}

export function voiceLengthError(seconds: number | null, size: number) {
  if (seconds != null && Number.isFinite(seconds)) {
    if (seconds < 0.2) return "That recording was empty.";
    if (seconds > VOICE_MAX_SECONDS + 0.75) return VOICE_TOO_LONG;
    return null;
  }
  if (size > VOICE_UNKNOWN_LENGTH_MAX_BYTES) return VOICE_LENGTH_UNKNOWN;
  return null;
}

export function voiceTitleError(prompt: string) {
  const title = prompt.trim();
  if (!title) return VOICE_TITLE_REQUIRED;
  if (title.length > VOICE_PROMPT_MAX) return VOICE_TITLE_TOO_LONG;
  return null;
}

/** Retag the file so Storage receives a mime the voice bucket allows. */
export function prepareVoiceFile(file: File) {
  const type = normalizeVoiceType(file);
  if (!type) return null;
  if (file.type === type) return file;
  return new File([file], file.name, { type, lastModified: file.lastModified });
}

export function readVoiceDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve(null);
      return;
    }
    const url = URL.createObjectURL(file);
    const audio = document.createElement("audio");
    const finish = (value: number | null) => {
      URL.revokeObjectURL(url);
      resolve(value);
    };
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      finish(Number.isFinite(audio.duration) ? audio.duration : null);
    };
    audio.onerror = () => finish(null);
    audio.src = url;
  });
}

/** Stable bar heights so the card matches a waveform before the file is fetched. */
export function voiceWaveform(seed: string, count = 42) {
  let hash = 2166136261;
  const input = seed.trim() || "voice";
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const bars: number[] = [];
  for (let i = 0; i < count; i += 1) {
    hash = Math.imul(hash ^ (hash >>> 16), 2246822519);
    const unit = (hash >>> 0) / 4294967295;
    const envelope = 0.45 + 0.55 * Math.sin((i / Math.max(count - 1, 1)) * Math.PI);
    bars.push(0.22 + unit * envelope * 0.78);
  }
  return bars;
}

export function voiceUploadFailureMessage(error: unknown) {
  const raw =
    error instanceof Error
      ? error.message
      : error &&
          typeof error === "object" &&
          "message" in error &&
          typeof error.message === "string"
        ? error.message
        : "";
  if (
    /maximum allowed size|payload too large|entity too large|exceeded the maximum/i.test(
      raw,
    )
  ) {
    return VOICE_TOO_LARGE;
  }
  if (raw) return raw;
  return "Unable to upload that recording.";
}
