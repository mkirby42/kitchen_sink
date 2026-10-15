import {
  analyticsInsertRequest,
  isLikelyBot,
  readOrCreateId,
  shouldSend,
  toInsertRow,
  type AnalyticsEvent,
  type SendGate,
} from "@/lib/analytics/payload";
import { supabasePublicConfig } from "@/lib/supabase/env";

const VISITOR_KEY = "ks_visitor";
const SESSION_KEY = "ks_session";

const gate: SendGate = { key: "", at: 0 };

function newId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "";
}

function trackingOff() {
  return (
    typeof document !== "undefined" &&
    document.documentElement.dataset.ksAnalytics === "off"
  );
}

/**
 * Fire-and-forget. Failures are swallowed. Uses the anon key on purpose so
 * the row is not tied to a signed-in account. Admins are skipped when the
 * document flag is off (set from the server layout).
 */
export function trackAnalytics(event: AnalyticsEvent) {
  try {
    if (typeof window === "undefined") return;
    if (trackingOff()) return;
    const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
    const webdriver =
      typeof navigator !== "undefined" && navigator.webdriver === true;
    if (isLikelyBot(ua, webdriver)) return;

    const config = supabasePublicConfig();
    if (!config) return;

    const row = toInsertRow(event, {
      visitorId: readOrCreateId(window.localStorage, VISITOR_KEY, newId),
      sessionId: readOrCreateId(window.sessionStorage, SESSION_KEY, newId),
    });
    if (!row) return;

    const key = `${row.event}|${row.path}|${row.therapist_id ?? ""}|${row.cta ?? ""}`;
    if (!shouldSend(key, Date.now(), gate)) return;

    const request = analyticsInsertRequest(config, row);
    void fetch(request.url, request.init).catch(() => {});
  } catch {
    // Tracking never breaks the page.
  }
}

export function trackPageView(path: string) {
  trackAnalytics({ event: "page_view", path });
}

export function trackCardClick(therapistId: string) {
  trackAnalytics({ event: "card_click", therapistId });
}

export function trackProfileView(therapistId: string) {
  trackAnalytics({ event: "profile_view", therapistId });
}

export function trackCta(therapistId: string, cta: "book" | "consult") {
  trackAnalytics({ event: "cta_click", therapistId, cta });
}
