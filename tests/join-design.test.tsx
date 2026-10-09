import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { JoinStep4 } from "@/components/join/JoinStep4";
import { JoinWizard } from "@/components/join/JoinWizard";
import type { JoinDraft } from "@/lib/join/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push() {}, replace() {} }),
}));

const userId = "11111111-1111-4111-8111-111111111111";

function wizard(props: { step?: 1 | 2 | 3 | 4; editing?: boolean } = {}) {
  return renderToStaticMarkup(
    createElement(JoinWizard, {
      userId,
      email: "maya@example.com",
      initialStep: props.step ?? 1,
      editing: props.editing,
    }),
  );
}

describe("join step design", () => {
  it("keeps the step bar and centers the title on the paper card", () => {
    const html = wizard();
    expect(html).toContain('aria-label="Go back"');
    expect(html).toContain('aria-label="Close"');
    expect(html).toContain('aria-label="Step 1 of 4"');
    expect(html).toContain("Step 1 of 4 · Basic info");
    expect(html).toContain("Let&#x27;s start with");
    expect(html).toContain("rounded-card");
    expect(html).toContain("shadow-card");
    expect(html).toContain("text-center");
    expect(html).toContain("font-display");
    expect(html).toContain("text-clay");
    expect(html).not.toContain("uppercase");
    expect(html).not.toContain("border-dashed");
    expect(html).toContain("bg-ink");
    expect(html).toContain("Continue →");
  });

  it("uses the white secondary pill for delete on edit", () => {
    const html = wizard({ editing: true });
    const button = html.match(/<button[^>]*>Delete profile<\/button>/);
    expect(button?.[0]).toContain("border-ink");
    expect(button?.[0]).toContain("bg-paper");
    expect(button?.[0]).not.toContain("border-clay");
    expect(button?.[0]).not.toContain("bg-clay");
    expect(html).not.toContain("uppercase");
  });

  it("keeps feedback on the last join step as the rounded box", () => {
    const html = wizard({ step: 4 });
    expect(html).toContain("Feedback for us");
    expect(html).toContain("We email it to the team when you submit.");
    expect(html).toContain("rounded-box");
    expect(html).toContain("Submit application →");

    const editing = wizard({ step: 4, editing: true });
    expect(editing).not.toContain("Feedback for us");
    expect(editing).toContain("Save changes →");
  });

  it("keeps the sliding-scale checkbox and the eggplant prompt switch", () => {
    const draft: JoinDraft = {
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
      rates: [
        { service_type: "Individual", duration_minutes: 50, price_cents: 0 },
      ],
      slidingScale: false,
      slidingScaleMinCents: null,
      slidingScaleMaxCents: null,
      cards: [],
      about: "",
      email: "",
      phone: "",
      outreach: ["email"],
      feedback: "",
    };
    const html = renderToStaticMarkup(
      createElement(JoinStep4, { draft, setDraft() {} }),
    );
    expect(html).toContain('type="checkbox"');
    expect(html).toContain("Offer sliding scale");
    expect(html).toContain("accent-ink");
    expect(html).toContain("bg-ink");
    expect(html).not.toContain("border-dashed");
    expect(html).toContain("border-ink");
  });
});
