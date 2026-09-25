export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 50 * 1024 * 1024;
export const PHOTO_ACCEPT = PHOTO_TYPES.join(",");
export const VIDEO_ACCEPT = VIDEO_TYPES.join(",");

export const PHOTO_TYPE_ERROR = "Choose a JPEG, PNG, WebP, or GIF photo.";
export const PHOTO_STILL_TOO_LARGE =
  "This photo is still over 5MB after resizing. Try a different photo, or email the team and they'll upload it for you.";
export const PHOTO_UNREADABLE =
  "Couldn't read that photo. Try a different image, or email the team and they'll upload it for you.";
export const VIDEO_STILL_TOO_LARGE =
  "That video is over 50MB. Choose a shorter clip, or email the team and they'll upload it for you.";

export function joinMediaPath(
  userId: string,
  kind: "photo" | "video",
  fileName: string,
  now = Date.now(),
) {
  const safeName = fileName.replace(/[^\w.\-]+/g, "_");
  return `${userId}/${kind}-${now}-${safeName}`;
}

export function mediaFileError(
  kind: "photo" | "video",
  file: { type: string; size: number },
) {
  const maxBytes = kind === "photo" ? PHOTO_MAX_BYTES : VIDEO_MAX_BYTES;
  const allowedTypes = kind === "photo" ? PHOTO_TYPES : VIDEO_TYPES;
  if (!allowedTypes.includes(file.type)) {
    return kind === "photo"
      ? PHOTO_TYPE_ERROR
      : "Choose an MP4, WebM, or QuickTime video.";
  }
  if (file.size > maxBytes) {
    return `${kind === "photo" ? "Photo" : "Video"} must be ${
      kind === "photo" ? "5MB" : "50MB"
    } or smaller.`;
  }
  return null;
}

/** Join/edit rejection. Admin helper upload keeps `mediaFileError` as-is. */
export function joinMediaRejection(
  kind: "photo" | "video",
  file: { type: string; size: number },
) {
  const error = mediaFileError(kind, file);
  if (!error) return null;
  const allowed = kind === "photo" ? PHOTO_TYPES : VIDEO_TYPES;
  const maxBytes = kind === "photo" ? PHOTO_MAX_BYTES : VIDEO_MAX_BYTES;
  if (allowed.includes(file.type) && file.size > maxBytes) {
    return kind === "photo" ? PHOTO_STILL_TOO_LARGE : VIDEO_STILL_TOO_LARGE;
  }
  return error;
}

function errorText(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message
  ) {
    return error.message;
  }
  return "";
}

export function uploadFailureMessage(kind: "photo" | "video", error: unknown) {
  const raw = errorText(error);
  if (
    /maximum allowed size|payload too large|entity too large|exceeded the maximum/i.test(
      raw,
    )
  ) {
    return kind === "photo" ? PHOTO_STILL_TOO_LARGE : VIDEO_STILL_TOO_LARGE;
  }
  if (raw) return raw;
  return `Unable to upload ${kind}.`;
}
