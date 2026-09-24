import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { JoinStep2 } from "@/components/join/JoinStep2";
import { UPLOAD_HELP_EMAIL } from "@/components/join/UploadHelp";
import type { JoinDraft } from "@/lib/join/types";
import { continueHint, step2Errors } from "@/lib/join/validate";

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
    openToNewClients: true,
    virtual: false,
    inPerson: false,
    specialties: [],
    modalities: [],
    insurance: [],
    identity: [],
    location: null,
    rates: [],
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
      "JPEG, PNG, WebP, or GIF · up to 5MB. This is the photo clients see first on your profile.",
    );
    expect(html).toContain("Optional. One short intro clip.");
    expect(html).toContain("MP4, WebM, or MOV · up to 50MB.");
  });

  it("still requires a photo before continue", () => {
    const draft = emptyDraft();
    expect(step2Errors(draft)).toContain("Photo is required");
    expect(continueHint(2, draft)).toBe("Add a photo to continue");
  });
});
