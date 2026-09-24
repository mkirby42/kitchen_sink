export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 50 * 1024 * 1024;
export const PHOTO_ACCEPT = PHOTO_TYPES.join(",");
export const VIDEO_ACCEPT = VIDEO_TYPES.join(",");

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
      ? "Choose a JPEG, PNG, WebP, or GIF photo."
      : "Choose an MP4, WebM, or QuickTime video.";
  }
  if (file.size > maxBytes) {
    return `${kind === "photo" ? "Photo" : "Video"} must be ${
      kind === "photo" ? "5MB" : "50MB"
    } or smaller.`;
  }
  return null;
}
