import { afterEach, describe, expect, it, vi } from "vitest";
import {
  analyticsLoadError,
  analyticsWindow,
  loadAnalytics,
  parseAnalyticsDashboard,
} from "@/lib/admin/analytics";
import {
  analyticsDataset,
  analyticsInsertRequest,
  analyticsPath,
  isLikelyBot,
  readOrCreateId,
  shouldSend,
  toInsertRow,
} from "@/lib/analytics/payload";
import { trackPageView } from "@/lib/analytics/track";

const VISITOR = "11111111-1111-4111-8111-111111111111";
const SESSION = "22222222-2222-4222-8222-222222222222";
const THERAPIST = "33333333-3333-4333-8333-333333333333";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("analytics payload", () => {
  it("keeps a pathname and drops tokens, emails, and off-site paths", () => {
    expect(analyticsPath("/find")).toBe("/find");
    expect(analyticsPath("/t/" + THERAPIST)).toBe("/t/" + THERAPIST);
    expect(analyticsPath("/reset-password?code=secret-token")).toBe("/reset-password");
    expect(analyticsPath("/reset-password#access_token=secret")).toBe("/reset-password");
    expect(analyticsPath("/join?email=person@example.com")).toBe("/join");
    expect(analyticsPath("https://evil.example/find")).toBeNull();
    expect(analyticsPath("//evil.example")).toBeNull();
    expect(analyticsPath("/find/../admin")).toBeNull();
    expect(analyticsPath("/a@b")).toBeNull();
    expect(analyticsPath("")).toBeNull();
  });

  it("skips crawlers and headless browsers, and keeps a person in WhatsApp", () => {
    expect(isLikelyBot("Mozilla/5.0 Chrome/120.0 Safari/537.36", false)).toBe(false);
    expect(isLikelyBot("", false)).toBe(false);
    expect(
      isLikelyBot(
        "Mozilla/5.0 (iPhone) Mobile/15E148 WhatsApp/2.23.20",
        false,
      ),
    ).toBe(false);
    expect(isLikelyBot("Mozilla/5.0 (compatible; Googlebot/2.1)", false)).toBe(true);
    expect(isLikelyBot("facebookexternalhit/1.1", false)).toBe(true);
    expect(isLikelyBot("curl/8.0.0", false)).toBe(true);
    expect(isLikelyBot("Mozilla/5.0 HeadlessChrome/120.0", false)).toBe(true);
    expect(isLikelyBot("Mozilla/5.0 Chrome/120.0", true)).toBe(true);
  });

  it("builds the four events without a timestamp or account id", () => {
    const ids = { visitorId: VISITOR, sessionId: SESSION };
    expect(toInsertRow({ event: "page_view", path: "/find?tags=Anxiety" }, ids)).toEqual({
      visitor_id: VISITOR,
      session_id: SESSION,
      event: "page_view",
      path: "/find",
    });
    expect(toInsertRow({ event: "card_click", therapistId: THERAPIST }, ids)).toMatchObject({
      event: "card_click",
      path: "/find",
      therapist_id: THERAPIST,
    });
    expect(
      toInsertRow({ event: "profile_view", therapistId: THERAPIST }, ids)?.path,
    ).toBe(`/t/${THERAPIST}`);
    expect(
      toInsertRow(
        { event: "cta_click", therapistId: THERAPIST, cta: "book" },
        ids,
      ),
    ).toMatchObject({ event: "cta_click", cta: "book", therapist_id: THERAPIST });
    expect(toInsertRow({ event: "card_click", therapistId: "maya" }, ids)).toBeNull();
    expect(toInsertRow({ event: "page_view", path: "/reset-password?code=x" }, {
      visitorId: "not-a-uuid",
      sessionId: SESSION,
    })).toBeNull();
  });

  it("posts as anon and does not ask PostgREST to return the row", () => {
    const request = analyticsInsertRequest(
      { url: "https://example.supabase.co/", key: "anon-key" },
      {
        visitor_id: VISITOR,
        session_id: SESSION,
        event: "page_view",
        path: "/",
      },
    );
    expect(request.url).toBe("https://example.supabase.co/rest/v1/analytics_events");
    expect(request.init.keepalive).toBe(true);
    expect(request.init.headers.Authorization).toBe("Bearer anon-key");
    expect(request.init.headers.Prefer).toBe("return=minimal");
    expect(request.init.body).not.toContain("created_at");
    expect(request.init.body).not.toContain("@");
  });

  it("reuses a stored visitor id and collapses a double send", () => {
    const store = {
      value: null as string | null,
      getItem() {
        return this.value;
      },
      setItem(_key: string, value: string) {
        this.value = value;
      },
    };
    const created = readOrCreateId(store, "ks_visitor_test", () => VISITOR);
    expect(created).toBe(VISITOR);
    expect(readOrCreateId(store, "ks_visitor_test", () => SESSION)).toBe(VISITOR);

    const state = { key: "", at: 0 };
    expect(shouldSend("page_view|/", 1_000, state)).toBe(true);
    expect(shouldSend("page_view|/", 1_500, state)).toBe(false);
    expect(shouldSend("page_view|/find", 1_600, state)).toBe(true);
  });

  it("turns tracking off only for an admin account", () => {
    expect(analyticsDataset("admin")).toBe("off");
    expect(analyticsDataset(null)).toBe("on");
    expect(analyticsDataset("therapist")).toBe("on");
    expect(analyticsDataset("patient")).toBe("on");
  });
});

describe("analytics dashboard", () => {
  it("parses totals, trend, and therapist clicks and drops junk", () => {
    const dashboard = parseAnalyticsDashboard(
      {
        days: 30,
        page_views: 12,
        visits: 4,
        unique_visitors: 3,
        visitor_id: VISITOR,
        top_pages: [
          { path: "/find?tags=Anxiety", views: 8 },
          { path: "https://evil.example", views: 99 },
          { path: `/t/${THERAPIST}`, views: 2 },
        ],
        trend: [
          { day: "2026-10-14", page_views: 5, visitors: 2 },
          { day: "nope", page_views: 9, visitors: 9 },
        ],
        therapists: [
          {
            id: THERAPIST,
            name: "  Maya Chen  ",
            card_clicks: 3,
            profile_views: 2,
            book_clicks: 1,
            consult_clicks: 0,
          },
          { id: "nope", name: "Skip", card_clicks: 9 },
        ],
      },
      7,
    );

    expect(dashboard.days).toBe(30);
    expect(dashboard.pageViews).toBe(12);
    expect(dashboard.visits).toBe(4);
    expect(dashboard.uniqueVisitors).toBe(3);
    expect(dashboard.topPages.map((page) => page.path)).toEqual([
      "/find",
      `/t/${THERAPIST}`,
    ]);
    expect(dashboard.topPages[1]?.label).toBe("Therapist profile");
    expect(dashboard.trend).toEqual([
      { day: "2026-10-14", label: "Oct 14", pageViews: 5, visitors: 2 },
    ]);
    expect(dashboard.therapists).toEqual([
      {
        id: THERAPIST,
        name: "Maya Chen",
        cardClicks: 3,
        profileViews: 2,
        bookClicks: 1,
        consultClicks: 0,
      },
    ]);
    expect(JSON.stringify(dashboard)).not.toContain(VISITOR);
  });

  it("defaults a bad window to 7 days and explains a missing migration", () => {
    expect(analyticsWindow(undefined)).toBe(7);
    expect(analyticsWindow("30")).toBe(30);
    expect(analyticsWindow(["30"])).toBe(30);
    expect(analyticsWindow("365")).toBe(7);
    expect(parseAnalyticsDashboard(null, 7).days).toBe(7);
    expect(parseAnalyticsDashboard({ days: 30, page_views: -4 }, 7).pageViews).toBe(0);
    expect(
      analyticsLoadError({ code: "PGRST202", message: "analytics_dashboard" }),
    ).toMatch(/migration/i);
    expect(analyticsLoadError({ code: "42501", message: "admin access required" })).toMatch(
      /Admin access/,
    );
    expect(analyticsLoadError({ message: "timeout" })).toMatch(/isn't available right now/);
  });

  it("asks the dashboard rpc for the selected window", async () => {
    const calls: unknown[] = [];
    const supabase = {
      rpc(name: string, args: unknown) {
        calls.push({ name, args });
        return Promise.resolve({
          data: { days: 7, page_views: 1, visits: 1, unique_visitors: 1 },
          error: null,
        });
      },
    };

    const dashboard = await loadAnalytics(supabase as never, 7);
    expect(calls).toEqual([
      { name: "analytics_dashboard", args: { p_days: 7 } },
    ]);
    expect(dashboard.pageViews).toBe(1);
  });
});

describe("analytics send", () => {
  it("does not throw when the insert fails, and skips admins and bots", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
    const memory = () => {
      const values = new Map<string, string>();
      return {
        getItem(key: string) {
          return values.get(key) ?? null;
        },
        setItem(key: string, value: string) {
          values.set(key, value);
        },
      };
    };
    const local = memory();
    const session = memory();
    const dataset: { ksAnalytics?: string } = { ksAnalytics: "on" };
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0 Chrome/120", webdriver: false });
    vi.stubGlobal("document", { documentElement: { dataset } });
    vi.stubGlobal("localStorage", local);
    vi.stubGlobal("sessionStorage", session);
    vi.stubGlobal("window", { localStorage: local, sessionStorage: session });
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");

    expect(() => trackPageView("/find")).not.toThrow();
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledOnce();
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.path).toBe("/find");
    expect(body.event).toBe("page_view");
    expect(body.therapist_id).toBeUndefined();

    fetchMock.mockClear();
    dataset.ksAnalytics = "off";
    trackPageView("/admin/analytics");
    expect(fetchMock).not.toHaveBeenCalled();

    dataset.ksAnalytics = "on";
    vi.stubGlobal("navigator", { userAgent: "Googlebot/2.1", webdriver: false });
    trackPageView("/find");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
