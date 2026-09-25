import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ReviewQueue } from "@/components/admin/ReviewQueue";
import type { PendingReview } from "@/lib/admin/reviews";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh() {}, push() {}, replace() {} }),
}));

const pending: PendingReview = {
  id: "rev-1",
  therapistId: "11111111-1111-4111-8111-111111111111",
  therapistName: "Maya Chen",
  authorLabel: "A. C.",
  understood: 5,
  communication: 4,
  fit: 5,
  body: "Clear and kind.",
  createdAt: "2026-03-01T15:00:00.000Z",
};

describe("ReviewQueue", () => {
  it("lists a pending review with approve and hard-delete", () => {
    const html = renderToStaticMarkup(
      createElement(ReviewQueue, { reviews: [pending] }),
    );
    expect(html).toContain("Review queue");
    expect(html).toContain("Rejected reviews are not kept.");
    expect(html).toContain("Maya Chen");
    expect(html).toContain("A. C.");
    expect(html).toContain("Clear and kind.");
    expect(html).toContain("Understood 5");
    expect(html).toContain("Approve");
    expect(html).toContain("Reject and delete");
    expect(html).toContain("/t/11111111-1111-4111-8111-111111111111");
  });

  it("shows an empty queue", () => {
    const html = renderToStaticMarkup(
      createElement(ReviewQueue, { reviews: [] }),
    );
    expect(html).toContain("No reviews waiting.");
    expect(html).not.toContain("Approve");
  });
});