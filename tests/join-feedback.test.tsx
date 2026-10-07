import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push() {}, replace() {} }),
}));

import { JoinWizard } from "@/components/join/JoinWizard";

describe("join feedback", () => {
  it("finishes on step 4 without a feedback-email error or retry", () => {
    const html = renderToStaticMarkup(
      createElement(JoinWizard, {
        userId: "11111111-1111-4111-8111-111111111111",
        email: "ada@example.com",
        initialStep: 4,
      }),
    );
    expect(html).toContain("Submit application →");
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
