import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { JoinStep2 } from "@/components/join/JoinStep2";
import { VoicePromptEditor } from "@/components/join/VoicePromptEditor";
import { UPLOAD_HELP_EMAIL } from "@/components/join/UploadHelp";
import type { JoinDraft } from "@/lib/join/types";
import {
  continueHint,
  PUBLISH_MEDIA_CONTINUE_NOTE,
  step2Errors,
} from "@/lib/join/validate";

function emptyDraft(): JoinDraft {
  return {
    name: "",
    credential: "",
    yearsPracticing: "",
    education: [],
    credentials: [],
    licenses: [],
    photoKey: null,
    videoKey: null,
    voiceKey: null,
    voicePrompt: null,
    openToNewClients: true,
    virtual: false,
    inPerson: false,
    specialties: [],
    modalities: [],
    insurance: [],
    identity: [],
    location: null,
    rates: [],
    slidingScale: false,
    slidingScaleMinCents: null,
    slidingScaleMaxCents: null,
    cards: [],
    about: "",
    email: "",
    phone: "",
    outreach: [],
    feedback: "",
  };
}

describe("step 2 upload help", () => {
  it("shows the team email and keeps photo and video constraints", () => {
    const html = renderToStaticMarkup(
      <JoinStep2 userId="user-1" draft={emptyDraft()} setDraft={() => {}} />,
    );

    expect(UPLOAD_HELP_EMAIL).toBe("chrislo5240@gmail.com");
    expect(html).toContain("chrislo5240@gmail.com");
    expect(html).toContain("mailto:chrislo5240@gmail.com");
    expect(html).toContain("Having trouble uploading?");
    expect(html).toContain("the team will help");
    expect(html).toContain("Need help uploading?");
    expect(html).toContain(
      "JPEG, PNG, WebP, or GIF · up to 5MB. This is the photo on your public profile.",
    );
    expect(html).toContain("Large photos are resized in your browser so they can upload.");
    expect(html).toContain("One short intro clip.");
    expect(html).toContain("no editing.");
    expect(html).not.toContain("Optional.");
    expect(html).toContain(PUBLISH_MEDIA_CONTINUE_NOTE);
    expect(html).toContain("MP4, WebM, or MOV · up to 50MB.");
    expect(html).toContain("No photo chosen yet.");
    expect(html).toContain("Choose a photo…");
    expect(html).not.toContain("Photo uploaded");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("<video");
  });

  it("shows a check once a photo or video is saved, and can replace or remove it", () => {
    const html = renderToStaticMarkup(
      <JoinStep2
        userId="user-1"
        draft={emptyDraft()}
        setDraft={() => {}}
      />,
    );
    expect(html).toContain("No video chosen yet.");

    const saved = renderToStaticMarkup(
      <JoinStep2
        userId="user-1"
        draft={{
          ...emptyDraft(),
          photoKey: "user-1/photo.jpg",
          videoKey: "user-1/intro.mp4",
        }}
        setDraft={() => {}}
      />,
    );
    expect(saved).toContain("Photo uploaded");
    expect(saved).toContain("Video uploaded");
    expect(saved).toContain("Replace photo…");
    expect(saved).toContain("Replace video…");
    expect(saved).toContain(">Remove<");
    expect(saved).not.toContain("<img");
    expect(saved).not.toContain("<video");
    expect(saved).not.toContain("rounded-full border");

    const voice = renderToStaticMarkup(
      <VoicePromptEditor
        name="Maya"
        prompt="A short hello"
        audioUrl="https://example.com/voice.webm"
        busy={false}
        onSave={async () => {}}
        onRemove={() => {}}
      />,
    );
    expect(voice).toContain("Voice prompt saved");
    expect(voice).toContain("Re-record");
    expect(voice).toContain(">Remove<");
  });

  it("does not require a photo or video before continue", () => {
    const draft = emptyDraft();
    expect(step2Errors(draft)).toEqual([]);
    expect(continueHint(2, draft)).toBe("");
  });
});
