import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push() {}, replace() {} }),
}));

import { JoinWizard } from "@/components/join/JoinWizard";
import type { JoinDraft } from "@/lib/join/types";

function draftWithMedia(): JoinDraft {
  return {
    name: "Ada Lovelace",
    credential: "LMFT",
    yearsPracticing: 4,
    education: [],
    credentials: [],
    licenses: [{ number: "1", state: "CA" }],
    photoKey: "uid/photo.jpg",
    videoKey: "uid/intro.mp4",
    voiceKey: null,
    voicePrompt: null,
    openToNewClients: true,
    virtual: true,
    inPerson: false,
    specialties: [],
    modalities: [],
    insurance: [],
    identity: [],
    location: null,
    rates: [
      { service_type: "Individual", duration_minutes: 50, price_cents: 10000 },
    ],
    slidingScale: false,
    slidingScaleMinCents: null,
    slidingScaleMaxCents: null,
    cards: [],
    about: "",
    email: "ada@example.com",
    phone: "",
    outreach: ["email"],
    feedback: "",
  };
}

describe("join feedback", () => {
  it("finishes on step 4 without a feedback-email error or retry", () => {
    const html = renderToStaticMarkup(
      createElement(JoinWizard, {
        userId: "11111111-1111-4111-8111-111111111111",
        email: "ada@example.com",
        initialStep: 4,
        initialDraft: draftWithMedia(),
      }),
    );
    expect(html).toContain("Publish profile →");
    expect(html).toContain("Save as draft");
    expect(html).not.toContain("Retry feedback email");
    expect(html).not.toContain("Sending feedback");
    expect(html).not.toContain("Your profile is saved");

    const wizard = readFileSync(
      resolve(process.cwd(), "components/join/JoinWizard.tsx"),
      "utf8",
    );
    expect(wizard).not.toContain("Retry feedback email");
    expect(wizard).not.toContain("profileSaved");

    const page = readFileSync(
      resolve(process.cwd(), "app/t/[id]/page.tsx"),
      "utf8",
    );
    expect(page).not.toContain("notifyPending");
    expect(page).not.toContain("feedback/notify");
    expect(page).not.toContain("sendFeedbackEmail");
    expect(page).not.toContain("resend");
  });
});
