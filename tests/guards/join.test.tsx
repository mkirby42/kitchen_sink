// Product-decision guard. Do not weaken this file to make CI pass.
// See docs/product-decisions.md.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { JoinSaveBar } from "@/components/join/JoinSaveBar";
import { JoinStep3 } from "@/components/join/JoinStep3";
import { editorSaveActions } from "@/lib/join/publish";
import type { JoinDraft } from "@/lib/join/types";
import { PUBLISH_MEDIA_NOTE } from "@/lib/join/validate";

function draft(): JoinDraft {
  return {
    name: "Maya Chen",
    credential: "LMFT",
    yearsPracticing: 9,
    education: [""],
    credentials: [""],
    licenses: [{ number: "MFC 112938", state: "CA" }],
    photoKey: null,
    videoKey: null,
    voiceKey: null,
    voicePrompt: null,
    openToNewClients: true,
    virtual: true,
    inPerson: false,
    specialties: ["Anxiety", "Career"],
    modalities: ["CBT"],
    insurance: ["Aetna"],
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

function saveBar(actions: { draft: boolean; publish: boolean; saveChanges: boolean }, mediaNote?: string) {
  return renderToStaticMarkup(
    createElement(JoinSaveBar, {
      step: 4,
      live: false,
      actions,
      blocked: false,
      submitting: false,
      mediaBusy: false,
      saveIntent: null,
      submitError: "",
      hint: "",
      mediaNote: mediaNote ?? null,
      onContinue() {},
      onSave() {},
    }),
  );
}

describe("join guards", () => {
  it("keeps Areas of Interest, Add your own, and the full approach name", () => {
    const html = renderToStaticMarkup(
      createElement(JoinStep3, { draft: draft(), setDraft() {} }),
    );
    expect(html).toContain("Areas of Interest");
    expect(html).toContain("Add your own");
    expect(html).toContain("Career");
    expect(html).toContain("Approach in Therapy");
    expect(html).toContain("Cognitive Behavioral Therapy (CBT)");
  });

  it("offers Publish only when a picture plus a video or a voice prompt is ready", () => {
    expect(editorSaveActions({ published: false, editing: true, mediaReady: false })).toEqual({
      draft: true,
      publish: false,
      saveChanges: false,
    });
    expect(editorSaveActions({ published: false, editing: true, mediaReady: true })).toEqual({
      draft: true,
      publish: true,
      saveChanges: false,
    });
    expect(editorSaveActions({ published: true, editing: true, mediaReady: true })).toEqual({
      draft: false,
      publish: false,
      saveChanges: true,
    });

    const blocked = saveBar(
      { draft: true, publish: false, saveChanges: false },
      PUBLISH_MEDIA_NOTE,
    );
    expect(blocked).toContain("Save as draft");
    expect(blocked).toContain(
      "You need a picture, plus a short video or a voice prompt, to publish your profile.",
    );
    expect(blocked).not.toContain("Publish profile");

    const ready = saveBar({ draft: true, publish: true, saveChanges: false });
    expect(ready).toContain("Save as draft");
    expect(ready).toContain("Publish profile");
  });
});
