import { describe, expect, it } from "vitest";
import {
  preferredVoiceMime,
  voiceRecordError,
  voiceRecordingFile,
  voiceUploadType,
} from "@/lib/join/record-voice";
import {
  VOICE_MAX_BYTES,
  VOICE_MAX_SECONDS,
  VOICE_PROMPT_MAX,
  normalizeVoiceType,
  prepareVoiceFile,
  voiceFileError,
  voiceLengthError,
  voiceTitleError,
  voiceWaveform,
} from "@/lib/join/voice";

describe("voice prompt files", () => {
  it("prefers mp4 for iOS Safari, then webm", () => {
    expect(preferredVoiceMime((type) => type === "audio/mp4")).toBe("audio/mp4");
    expect(
      preferredVoiceMime((type) => type.startsWith("audio/webm")),
    ).toBe("audio/webm;codecs=opus");
    expect(preferredVoiceMime(() => false)).toBeNull();
    expect(voiceUploadType("audio/mp4;codecs=mp4a.40.2")).toBe("audio/mp4");
    expect(voiceUploadType("audio/webm;codecs=opus")).toBe("audio/webm");
    expect(voiceUploadType("audio/x-m4a")).toBe("audio/mp4");
  });

  it("builds an uploadable recording and ignores an empty blob", () => {
    const file = voiceRecordingFile(
      new Blob(["clip"], { type: "audio/mp4" }),
      "audio/mp4",
      5,
    );
    expect(file?.name).toBe("voice-5.m4a");
    expect(file?.type).toBe("audio/mp4");
    expect(voiceRecordingFile(new Blob(["x"], { type: "" }), "audio/webm;codecs=opus")?.type).toBe(
      "audio/webm",
    );
    expect(voiceRecordingFile(new Blob([], { type: "audio/mp4" }), "audio/mp4")).toBeNull();
  });

  it("accepts phone audio types and rejects everything else", () => {
    expect(normalizeVoiceType({ type: "", name: "hello.m4a" })).toBe("audio/mp4");
    expect(normalizeVoiceType({ type: "audio/mpeg", name: "hello.mp3" })).toBe("audio/mpeg");
    expect(normalizeVoiceType({ type: "audio/wav", name: "hello.wav" })).toBe("audio/wav");
    expect(normalizeVoiceType({ type: "video/mp4", name: "clip.mp4" })).toBeNull();
    expect(voiceFileError({ type: "audio/mpeg", size: 1000, name: "a.mp3" })).toBeNull();
    expect(voiceFileError({ type: "application/pdf", size: 1000, name: "a.pdf" })).toMatch(
      /M4A/,
    );
    expect(
      voiceFileError({ type: "audio/mp4", size: VOICE_MAX_BYTES + 1, name: "a.m4a" }),
    ).toMatch(/8MB/);
  });

  it("caps a voice prompt at 30 seconds and 80 characters", () => {
    expect(VOICE_MAX_SECONDS).toBe(30);
    expect(voiceLengthError(30, 1000)).toBeNull();
    expect(voiceLengthError(31, 1000)).toMatch(/30 seconds/);
    expect(voiceLengthError(null, 200_000)).toBeNull();
    expect(voiceLengthError(Number.POSITIVE_INFINITY, 2_000_000)).toMatch(/length/);
    expect(voiceTitleError("  Hello  ")).toBeNull();
    expect(voiceTitleError("   ")).toMatch(/title/);
    expect(voiceTitleError("a".repeat(VOICE_PROMPT_MAX + 1))).toMatch(/80/);
    const prepared = prepareVoiceFile(new File(["x"], "talk.m4a", { type: "" }));
    expect(prepared?.type).toBe("audio/mp4");
  });

  it("draws a stable waveform without fetching the audio", () => {
    const bars = voiceWaveform("Say hello");
    expect(bars).toHaveLength(42);
    expect(bars.every((bar) => bar > 0 && bar <= 1)).toBe(true);
    expect(voiceWaveform("Say hello")).toEqual(bars);
    expect(voiceWaveform("A different line")).not.toEqual(bars);
  });

  it("explains a blocked microphone separately from a missing one", () => {
    expect(voiceRecordError({ name: "NotAllowedError" })).toMatch(/blocked/i);
    expect(voiceRecordError({ name: "NotFoundError" })).toMatch(/No microphone/);
    expect(voiceRecordError({ name: "AbortError" })).toMatch(/Couldn't start/);
  });
});
