// Product-decision guard. Do not weaken this file to make CI pass.
// See docs/product-decisions.md.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ReferralBoard } from "@/components/referrals/ReferralBoard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push() {}, refresh() {} }),
}));

describe("referral board guards", () => {
  it("keeps the intro and the How it works steps", () => {
    const html = renderToStaticMarkup(
      createElement(ReferralBoard, {
        posts: [],
        filter: { kind: "all" },
        loadError: null,
        now: Date.parse("2026-10-22T12:00:00Z"),
        viewer: {
          specialtyLabels: [],
          insuranceLabels: [],
          virtual: true,
          inPerson: false,
          slidingScale: false,
        },
      }),
    );
    expect(html).toContain("When your caseload is full");
    expect(html).toContain("help them find their therapist.");
    expect(html).toContain("How it works");
    expect(html).toContain("Hide");
    expect(html).toContain("01 — Post a referral");
    expect(html).toContain("02 — We approve it");
    expect(html).toContain("03 — Therapists tap interested");
    expect(html).toContain("04 — You follow up off the board");
    expect(html).toContain("05 — Refresh after the week");
    expect(html).toContain("Only signed-in therapists with a published profile can see this board.");
    expect(html).toContain("Kitchen Sink stores no client name, email, or phone.");
  });
});
