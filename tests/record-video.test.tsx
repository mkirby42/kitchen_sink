import { renderToStaticMarkup } from "react-dom/server";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { IntroRecordDialog } from "@/components/join/IntroRecordDialog";
import { IntroRecorder } from "@/components/join/IntroRecorder";
import {
  INTRO_MAX_SECONDS,
  INTRO_SIZE_STOP_BYTES,
  acquireIntroCamera,
  canRecordIntro,
  formatRecordClock,
  introRecordingFile,
  preferredRecorderMime,
  recordErrorMessage,
  recordingFileType,
  shouldStopForSize,
} from "@/lib/join/record-video";

describe("intro recording", () => {
  it("prefers a webm mime the storage bucket already allows", () => {
    expect(preferredRecorderMime((type) => type.startsWith("video/webm"))).toBe(
      "video/webm;codecs=vp8,opus",
    );
    expect(preferredRecorderMime((type) => type === "video/mp4")).toBe("video/mp4");
    expect(preferredRecorderMime(() => false)).toBeNull();
    expect(recordingFileType("video/webm;codecs=vp8,opus")).toBe("video/webm");
    expect(recordingFileType("video/mp4")).toBe("video/mp4");
    expect(recordingFileType("video/quicktime")).toBeNull();
  });

  it("builds an uploadable file and ignores an empty blob", () => {
    const file = introRecordingFile(new Blob(["clip"], { type: "video/webm;codecs=vp8,opus" }), 5);
    expect(file?.name).toBe("intro-5.webm");
    expect(file?.type).toBe("video/webm");
    expect(file?.size).toBeGreaterThan(0);
    expect(introRecordingFile(new Blob([], { type: "video/webm" }))).toBeNull();
    expect(introRecordingFile(new Blob(["x"], { type: "video/quicktime" }))).toBeNull();
  });

  it("caps the clock and the byte budget", () => {
    expect(INTRO_MAX_SECONDS).toBe(90);
    expect(formatRecordClock(0)).toBe("0:00");
    expect(formatRecordClock(90)).toBe("1:30");
    expect(shouldStopForSize(INTRO_SIZE_STOP_BYTES - 1)).toBe(false);
    expect(shouldStopForSize(INTRO_SIZE_STOP_BYTES)).toBe(true);
  });

  it("explains a denied camera separately from a missing one", () => {
    expect(recordErrorMessage({ name: "NotAllowedError" })).toMatch(/blocked/i);
    expect(recordErrorMessage({ name: "NotFoundError" })).toMatch(/No camera/);
    expect(recordErrorMessage({ name: "AbortError" })).toMatch(/Couldn't start/);
  });

  it("falls back to a plain camera and stops after a permission denial", async () => {
    const deniedCalls: MediaStreamConstraints[] = [];
    const denied = await acquireIntroCamera(async (constraints) => {
      deniedCalls.push(constraints);
      throw Object.assign(new Error("denied"), { name: "NotAllowedError" });
    }, () => true);
    expect(denied.stream).toBeNull();
    expect(denied.error).toMatchObject({ name: "NotAllowedError" });
    expect(deniedCalls).toHaveLength(1);

    let attempts = 0;
    const stopped = { n: 0 };
    const stream = {
      getTracks: () => [{ stop: () => { stopped.n += 1; } }],
    } as unknown as MediaStream;
    const opened = await acquireIntroCamera(async () => {
      attempts += 1;
      if (attempts === 1) {
        throw Object.assign(new Error("constraints"), { name: "OverconstrainedError" });
      }
      return stream;
    }, () => true);
    expect(opened.stream).toBe(stream);
    expect(attempts).toBe(2);

    const dropped = await acquireIntroCamera(async () => stream, () => false);
    expect(dropped.stream).toBeNull();
    expect(stopped.n).toBe(1);
  });

  it("hides recording when MediaRecorder cannot produce an allowed mime", () => {
    expect(canRecordIntro({})).toBe(false);
    expect(
      canRecordIntro({
        mediaRecorder: function MediaRecorder() {},
        getUserMedia: () => Promise.resolve({} as MediaStream),
        isTypeSupported: () => false,
      }),
    ).toBe(false);
    expect(
      canRecordIntro({
        mediaRecorder: function MediaRecorder() {},
        getUserMedia: () => Promise.resolve({} as MediaStream),
        isTypeSupported: (type) => type === "video/webm",
      }),
    ).toBe(true);
  });
});

describe("intro record dialog", () => {
  const base = {
    dialogRef: createRef<HTMLDialogElement>(),
    liveRef: createRef<HTMLVideoElement>(),
    titleId: "record-title",
    error: "",
    elapsed: 12,
    reviewUrl: null as string | null,
    sizeNote: false,
    limitLabel: "1:30",
    onStart: () => {},
    onStop: () => {},
    onUse: () => {},
    onAgain: () => {},
    onClose: () => {},
  };

  it("offers start once the camera is ready", () => {
    const html = renderToStaticMarkup(<IntroRecordDialog {...base} phase="ready" />);
    expect(html).toContain("Record intro");
    expect(html).toContain("Start recording");
    expect(html).toContain("0:12 / 1:30");
    expect(html).toContain("choose a video file instead");
    expect(html).not.toContain("Use this intro");
  });

  it("shows a denial on the ready screen and keeps file upload as the way out", () => {
    const html = renderToStaticMarkup(
      <IntroRecordDialog
        {...base}
        phase="ready"
        error="Camera or microphone access was blocked. Allow it in the browser, or choose a video file instead."
      />,
    );
    expect(html).toContain("access was blocked");
    expect(html).toContain("Record again");
    expect(html).not.toContain("Start recording");
  });

  it("shows stop while recording and use/discard after review", () => {
    const live = renderToStaticMarkup(
      <IntroRecordDialog {...base} phase="recording" />,
    );
    expect(live).toContain("Stop");
    expect(live).not.toContain("Opening camera");

    const review = renderToStaticMarkup(
      <IntroRecordDialog
        {...base}
        phase="review"
        reviewUrl="blob:intro"
        sizeNote
      />,
    );
    expect(review).toContain("Use this intro");
    expect(review).toContain("Discard");
    expect(review).toContain("Stopped so the recording stays under the upload limit.");
    expect(review).toContain("blob:intro");
  });

  it("does not offer record on the server, where MediaRecorder is missing", () => {
    const html = renderToStaticMarkup(
      <IntroRecorder disabled={false} onFile={() => {}} />,
    );
    expect(html).toBe("");
  });
});
