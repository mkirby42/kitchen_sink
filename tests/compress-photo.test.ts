import { describe, expect, it, vi } from "vitest";
import {
  PhotoPrepareError,
  compressDecodedPhoto,
  fittedSize,
  photoJpegName,
  prepareJoinPhoto,
} from "@/lib/join/compress-photo";
import {
  PHOTO_MAX_BYTES,
  PHOTO_STILL_TOO_LARGE,
  PHOTO_TYPE_ERROR,
  PHOTO_UNREADABLE,
  VIDEO_STILL_TOO_LARGE,
  joinMediaRejection,
  uploadFailureMessage,
} from "@/lib/join/media";

function file(name: string, type: string, size: number) {
  const bytes = new Uint8Array(Math.min(size, 32));
  const blob = new File([bytes], name, { type });
  Object.defineProperty(blob, "size", { value: size });
  return blob;
}

describe("photo resize", () => {
  it("fits the long edge and does not enlarge a small image", () => {
    expect(fittedSize(4000, 3000, 2048)).toEqual({ width: 2048, height: 1536 });
    expect(fittedSize(800, 600, 2048)).toEqual({ width: 800, height: 600 });
    expect(fittedSize(900, 1600, 1280)).toEqual({ width: 720, height: 1280 });
  });

  it("names the jpeg after the original file", () => {
    expect(photoJpegName("Head Shot.PNG")).toBe("Head_Shot.jpg");
    expect(photoJpegName(".png")).toBe("photo.jpg");
  });

  it("keeps a photo that is already under 5MB", async () => {
    const original = file("ok.jpg", "image/jpeg", 200_000);
    const compress = vi.fn();
    await expect(prepareJoinPhoto(original, compress)).resolves.toBe(original);
    expect(compress).not.toHaveBeenCalled();
  });

  it("rejects a type storage will not accept", async () => {
    const compress = vi.fn();
    await expect(
      prepareJoinPhoto(file("pic.heic", "image/heic", 100), compress),
    ).rejects.toThrow(PHOTO_TYPE_ERROR);
    expect(compress).not.toHaveBeenCalled();
  });

  it("resizes an oversized photo and uploads the smaller jpeg", async () => {
    const original = file("phone.jpg", "image/jpeg", PHOTO_MAX_BYTES + 50_000);
    const jpeg = new Blob([new Uint8Array(1200)], { type: "image/jpeg" });
    const compress = vi.fn().mockResolvedValue(
      new File([jpeg], "phone.jpg", { type: "image/jpeg" }),
    );
    const ready = await prepareJoinPhoto(original, compress);
    expect(compress).toHaveBeenCalledWith(original);
    expect(ready.type).toBe("image/jpeg");
    expect(ready.size).toBeLessThan(PHOTO_MAX_BYTES);
  });

  it("turns a failed decode into an actionable error", async () => {
    const original = file("phone.jpg", "image/jpeg", PHOTO_MAX_BYTES + 1);
    await expect(
      prepareJoinPhoto(original, () => Promise.reject(new Error("decode failed"))),
    ).rejects.toThrow(PHOTO_UNREADABLE);
  });

  it("picks the first encode under the cap and stops", async () => {
    const big = new Blob([new Uint8Array(PHOTO_MAX_BYTES + 8)]);
    const small = new Blob([new Uint8Array(32)]);
    const closed = vi.fn();
    const encodeSized = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(big)
      .mockResolvedValueOnce(small)
      .mockResolvedValueOnce(new Blob([new Uint8Array(1)]));

    const ready = await compressDecodedPhoto(
      file("phone.png", "image/png", PHOTO_MAX_BYTES + 1),
      { width: 4032, height: 3024, close: closed },
      encodeSized,
    );

    expect(encodeSized).toHaveBeenCalledTimes(3);
    expect(encodeSized.mock.calls[2][0]).toMatchObject({
      width: 1600,
      height: 1200,
      quality: 0.86,
    });
    expect(ready.name).toBe("phone.jpg");
    expect(ready.type).toBe("image/jpeg");
    expect(ready.size).toBe(32);
    expect(closed).toHaveBeenCalledOnce();
  });

  it("says when every attempt is still over 5MB", async () => {
    const huge = new Blob([new Uint8Array(PHOTO_MAX_BYTES + 8)]);
    const closed = vi.fn();
    await expect(
      compressDecodedPhoto(
        file("noise.jpg", "image/jpeg", PHOTO_MAX_BYTES + 1),
        { width: 4000, height: 3000, close: closed },
        () => Promise.resolve(huge),
      ),
    ).rejects.toThrow(PHOTO_STILL_TOO_LARGE);
    expect(closed).toHaveBeenCalledOnce();
  });

  it("says when the browser produced no image", async () => {
    await expect(
      compressDecodedPhoto(
        file("x.jpg", "image/jpeg", PHOTO_MAX_BYTES + 1),
        { width: 100, height: 100 },
        () => Promise.resolve(null),
      ),
    ).rejects.toThrow(PHOTO_UNREADABLE);
  });
});

describe("join upload errors", () => {
  it("keeps admin-sized video rejections actionable on join", () => {
    expect(
      joinMediaRejection("video", {
        type: "video/mp4",
        size: 50 * 1024 * 1024 + 1,
      }),
    ).toBe(VIDEO_STILL_TOO_LARGE);
    expect(joinMediaRejection("video", { type: "video/mp4", size: 1000 })).toBeNull();
    expect(joinMediaRejection("photo", { type: "image/gif", size: 10 })).toBeNull();
  });

  it("maps storage size failures to the same help", () => {
    expect(
      uploadFailureMessage("photo", {
        message: "The object exceeded the maximum allowed size",
      }),
    ).toBe(PHOTO_STILL_TOO_LARGE);
    expect(
      uploadFailureMessage("video", new Error("Payload Too Large")),
    ).toBe(VIDEO_STILL_TOO_LARGE);
    expect(uploadFailureMessage("video", new Error("network down"))).toBe(
      "network down",
    );
  });

  it("preserves PhotoPrepareError as the thrown type", () => {
    const error = new PhotoPrepareError(PHOTO_STILL_TOO_LARGE);
    expect(error).toBeInstanceOf(PhotoPrepareError);
    expect(error.name).toBe("PhotoPrepareError");
  });
});
