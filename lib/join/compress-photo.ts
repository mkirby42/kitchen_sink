import {
  PHOTO_MAX_BYTES,
  PHOTO_STILL_TOO_LARGE,
  PHOTO_TYPE_ERROR,
  PHOTO_TYPES,
  PHOTO_UNREADABLE,
} from "@/lib/join/media";

/** Longest-edge and JPEG quality attempts. First success under the cap wins. */
export const PHOTO_ENCODE_PLAN = [
  { maxEdge: 2048, quality: 0.88 },
  { maxEdge: 2048, quality: 0.8 },
  { maxEdge: 1600, quality: 0.86 },
  { maxEdge: 1600, quality: 0.76 },
  { maxEdge: 1280, quality: 0.82 },
  { maxEdge: 1024, quality: 0.8 },
  { maxEdge: 800, quality: 0.72 },
] as const;

const CANVAS_FILL = "#f6f0e6";

export class PhotoPrepareError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PhotoPrepareError";
  }
}

export function fittedSize(width: number, height: number, maxEdge: number) {
  if (width < 1 || height < 1 || maxEdge < 1) {
    throw new PhotoPrepareError(PHOTO_UNREADABLE);
  }
  const longest = Math.max(width, height);
  if (longest <= maxEdge) {
    return { width: Math.round(width), height: Math.round(height) };
  }
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function photoJpegName(originalName: string) {
  const base = originalName.replace(/\.[^.]+$/, "").trim();
  const safe = base.replace(/[^\w.\-]+/g, "_").replace(/^\.+/, "");
  return `${safe || "photo"}.jpg`;
}

type EncodeArgs = { width: number; height: number; quality: number };

export async function compressDecodedPhoto(
  file: File,
  decoded: { width: number; height: number; close?: () => void },
  encode: (args: EncodeArgs) => Promise<Blob | null>,
  maxBytes = PHOTO_MAX_BYTES,
) {
  let produced = false;
  try {
    for (const step of PHOTO_ENCODE_PLAN) {
      const size = fittedSize(decoded.width, decoded.height, step.maxEdge);
      const blob = await encode({ ...size, quality: step.quality });
      if (!blob || blob.size < 1) continue;
      produced = true;
      if (blob.size <= maxBytes) {
        return new File([blob], photoJpegName(file.name), { type: "image/jpeg" });
      }
    }
  } finally {
    decoded.close?.();
  }
  throw new PhotoPrepareError(produced ? PHOTO_STILL_TOO_LARGE : PHOTO_UNREADABLE);
}

export async function compressPhotoInBrowser(file: File) {
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") {
    throw new PhotoPrepareError(PHOTO_UNREADABLE);
  }

  let decoded: ImageBitmap;
  try {
    decoded = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    try {
      decoded = await createImageBitmap(file);
    } catch {
      throw new PhotoPrepareError(PHOTO_UNREADABLE);
    }
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    decoded.close?.();
    throw new PhotoPrepareError(PHOTO_UNREADABLE);
  }

  return compressDecodedPhoto(file, decoded, ({ width, height, quality }) => {
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = CANVAS_FILL;
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(decoded, 0, 0, width, height);
    return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  });
}

export async function prepareJoinPhoto(
  file: File,
  compress: (file: File) => Promise<File> = compressPhotoInBrowser,
) {
  if (!PHOTO_TYPES.includes(file.type)) {
    throw new PhotoPrepareError(PHOTO_TYPE_ERROR);
  }
  if (file.size <= PHOTO_MAX_BYTES) return file;
  try {
    return await compress(file);
  } catch (error) {
    if (error instanceof PhotoPrepareError) throw error;
    throw new PhotoPrepareError(PHOTO_UNREADABLE);
  }
}
