const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PATH_RE = /^\/[A-Za-z0-9/_.~-]*$/;

/**
 * Crawlers only. In-app browsers (WhatsApp, Instagram) stay so a shared
 * link still counts. `navigator.webdriver` is checked separately.
 */
const BOT_RE =
  /googlebot|bingbot|duckduckbot|baiduspider|yandexbot|slurp|facebookexternalhit|embedly|pinterestbot|redditbot|whatsappbot|telegrambot|applebot|gptbot|oai-searchbot|chatgpt-user|claudebot|claude-searchbot|claude-user|perplexitybot|petalbot|ahrefsbot|semrushbot|mj12bot|dotbot|bytespider|amazonbot|headlesschrome|phantomjs|wget\/|curl\/|python-requests|go-http-client|lighthouse|pagespeed|ia_archiver|sogou|exabot|twitterbot|linkedinbot|discordbot|spider|crawler/i;

export type AnalyticsEventName =
  | "page_view"
  | "card_click"
  | "profile_view"
  | "cta_click";

export type AnalyticsEvent =
  | { event: "page_view"; path: string }
  | { event: "card_click"; therapistId: string }
  | { event: "profile_view"; therapistId: string }
  | { event: "cta_click"; therapistId: string; cta: "book" | "consult" };

/** Columns the anon insert grant allows. Never id, created_at, or an account. */
export type AnalyticsInsert = {
  visitor_id: string;
  session_id: string;
  event: AnalyticsEventName;
  path: string;
  therapist_id?: string;
  cta?: "book" | "consult";
};

export function isAnalyticsUuid(value: string) {
  return UUID_RE.test(value);
}

/** Pathname only. Query and hash can carry reset tokens and emails. */
export function analyticsPath(input: string): string | null {
  const path = input.split("?")[0]?.split("#")[0] ?? "";
  if (path.length < 1 || path.length > 180) return null;
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  if (path.includes("//")) return null;
  if (path.includes("..")) return null;
  if (path.includes("@")) return null;
  if (!PATH_RE.test(path)) return null;
  return path;
}

/** Server layout: admins do not get a tracker, in any view. */
export function analyticsDataset(role: string | null | undefined) {
  return role === "admin" ? "off" : "on";
}

export function isLikelyBot(userAgent: string, webdriver = false) {
  if (webdriver) return true;
  if (!userAgent) return false;
  return BOT_RE.test(userAgent);
}

type IdStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

const memoryIds = new Map<string, string>();

export function readOrCreateId(
  storage: IdStore | null,
  key: string,
  create: () => string,
) {
  const remembered = memoryIds.get(key);
  try {
    const existing = storage?.getItem(key) ?? null;
    if (existing && UUID_RE.test(existing)) {
      memoryIds.set(key, existing);
      return existing;
    }
  } catch {
    // Private mode and blocked storage still get one id for this page.
  }

  if (remembered && UUID_RE.test(remembered)) return remembered;

  const next = create();
  if (!UUID_RE.test(next)) return "";
  memoryIds.set(key, next);
  try {
    storage?.setItem(key, next);
  } catch {
    // Keep the in-memory id.
  }
  return next;
}

export function toInsertRow(
  event: AnalyticsEvent,
  ids: { visitorId: string; sessionId: string },
): AnalyticsInsert | null {
  if (!UUID_RE.test(ids.visitorId) || !UUID_RE.test(ids.sessionId)) return null;

  if (event.event === "page_view") {
    const path = analyticsPath(event.path);
    if (!path) return null;
    return {
      visitor_id: ids.visitorId,
      session_id: ids.sessionId,
      event: "page_view",
      path,
    };
  }

  if (!UUID_RE.test(event.therapistId)) return null;

  if (event.event === "card_click") {
    return {
      visitor_id: ids.visitorId,
      session_id: ids.sessionId,
      event: "card_click",
      path: "/find",
      therapist_id: event.therapistId,
    };
  }

  const path = analyticsPath(`/t/${event.therapistId}`);
  if (!path) return null;

  if (event.event === "profile_view") {
    return {
      visitor_id: ids.visitorId,
      session_id: ids.sessionId,
      event: "profile_view",
      path,
      therapist_id: event.therapistId,
    };
  }

  if (event.cta !== "book" && event.cta !== "consult") return null;
  return {
    visitor_id: ids.visitorId,
    session_id: ids.sessionId,
    event: "cta_click",
    path,
    therapist_id: event.therapistId,
    cta: event.cta,
  };
}

export function analyticsInsertRequest(
  config: { url: string; key: string },
  row: AnalyticsInsert,
) {
  const base = config.url.replace(/\/$/, "");
  return {
    url: `${base}/rest/v1/analytics_events`,
    init: {
      method: "POST",
      keepalive: true,
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    },
  };
}

export type SendGate = { key: string; at: number };

/** Collapse the double effect in dev and a double click on the same control. */
export function shouldSend(key: string, now: number, state: SendGate) {
  if (state.key === key && now - state.at < 2000) return false;
  state.key = key;
  state.at = now;
  return true;
}
