import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import type { AnalyticsDashboard as Dashboard } from "@/lib/admin/analytics";

const THERAPIST = "33333333-3333-4333-8333-333333333333";

function data(overrides: Partial<Dashboard> = {}): Dashboard {
  return {
    days: 7,
    pageViews: 12,
    visits: 4,
    uniqueVisitors: 3,
    topPages: [{ path: "/find", label: "Find", views: 8 }],
    trend: [
      { day: "2026-10-14", label: "Oct 14", pageViews: 5, visitors: 2 },
      { day: "2026-10-15", label: "Oct 15", pageViews: 7, visitors: 3 },
    ],
    therapists: [
      {
        id: THERAPIST,
        name: "Maya Chen",
        cardClicks: 3,
        profileViews: 2,
        bookClicks: 1,
        consultClicks: 4,
      },
    ],
    ...overrides,
  };
}

describe("analytics dashboard", () => {
  it("shows totals, the window, and per-therapist clicks", () => {
    const html = renderToStaticMarkup(createElement(AnalyticsDashboard, { data: data() }));
    expect(html).toContain("Analytics");
    expect(html).toContain("Page views");
    expect(html).toContain("Unique visitors");
    expect(html).toContain(">12<");
    expect(html).toContain("Last 7 days");
    expect(html).toContain('href="/admin/analytics?days=30"');
    expect(html).toContain("aria-current=\"page\"");
    expect(html).toContain("Oct 15");
    expect(html).toContain("Find card clicks");
    expect(html).toContain("Book a Session");
    expect(html).toContain("Free Consult");
    expect(html).toContain("Maya Chen");
    expect(html).toContain(`href="/t/${THERAPIST}"`);
    expect(html).toContain("Dates are UTC");
    expect(html).not.toContain("visitor_id");
  });

  it("says when the window is empty", () => {
    const html = renderToStaticMarkup(
      createElement(AnalyticsDashboard, {
        data: data({
          days: 30,
          pageViews: 0,
          visits: 0,
          uniqueVisitors: 0,
          topPages: [],
          trend: [],
          therapists: [],
        }),
      }),
    );
    expect(html).toContain("Nothing recorded in this window yet.");
    expect(html).toContain('href="/admin/analytics?days=7"');
    expect(html).toContain("No card clicks, profile views, or booking clicks");
  });
});
