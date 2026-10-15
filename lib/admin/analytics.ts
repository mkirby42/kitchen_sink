import type { SupabaseClient } from "@supabase/supabase-js";
import { analyticsPath, isAnalyticsUuid } from "@/lib/analytics/payload";

export type AnalyticsWindow = 7 | 30;

export type AnalyticsTopPage = {
  path: string;
  label: string;
  views: number;
};

export type AnalyticsTrendPoint = {
  day: string;
  label: string;
  pageViews: number;
  visitors: number;
};

export type AnalyticsTherapist = {
  id: string;
  name: string;
  cardClicks: number;
  profileViews: number;
  bookClicks: number;
  consultClicks: number;
};

export type AnalyticsDashboard = {
  days: AnalyticsWindow;
  pageViews: number;
  visits: number;
  uniqueVisitors: number;
  topPages: AnalyticsTopPage[];
  trend: AnalyticsTrendPoint[];
  therapists: AnalyticsTherapist[];
};

const PAGE_LABELS: Record<string, string> = {
  "/": "Home",
  "/find": "Find",
  "/join": "Join",
  "/for-therapists": "For therapists",
  "/forgot-password": "Forgot password",
  "/reset-password": "Reset password",
  "/profile-deleted": "Profile deleted",
  "/admin/analytics": "Analytics",
  "/admin/media": "Uploads",
  "/admin/reviews": "Reviews",
  "/admin/starts": "Drafts",
};

export function analyticsWindow(value: string | string[] | undefined): AnalyticsWindow {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "30" ? 30 : 7;
}

export function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatAnalyticsDay(day: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) return day;
  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
  );
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function analyticsPageLabel(path: string) {
  if (PAGE_LABELS[path]) return PAGE_LABELS[path];
  if (/^\/t\/[0-9a-f-]{36}$/i.test(path)) return "Therapist profile";
  return path;
}

function count(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(1_000_000_000, Math.round(n));
}

function record(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function parseAnalyticsDashboard(
  value: unknown,
  fallbackDays: AnalyticsWindow,
): AnalyticsDashboard {
  const row = record(value);
  const days: AnalyticsWindow = row?.days === 30 ? 30 : row?.days === 7 ? 7 : fallbackDays;
  const topPages = Array.isArray(row?.top_pages) ? row.top_pages : [];
  const trend = Array.isArray(row?.trend) ? row.trend : [];
  const therapists = Array.isArray(row?.therapists) ? row.therapists : [];

  return {
    days,
    pageViews: count(row?.page_views),
    visits: count(row?.visits),
    uniqueVisitors: count(row?.unique_visitors),
    topPages: topPages.slice(0, 10).flatMap((item) => {
      const page = record(item);
      const path = typeof page?.path === "string" ? analyticsPath(page.path) : null;
      if (!path) return [];
      return [{ path, label: analyticsPageLabel(path), views: count(page?.views) }];
    }),
    trend: trend.slice(0, 31).flatMap((item) => {
      const point = record(item);
      const day = typeof point?.day === "string" ? point.day.slice(0, 10) : "";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return [];
      return [
        {
          day,
          label: formatAnalyticsDay(day),
          pageViews: count(point?.page_views),
          visitors: count(point?.visitors),
        },
      ];
    }),
    therapists: therapists.slice(0, 40).flatMap((item) => {
      const therapist = record(item);
      const id = typeof therapist?.id === "string" ? therapist.id : "";
      if (!isAnalyticsUuid(id)) return [];
      const name =
        typeof therapist?.name === "string" && therapist.name.trim()
          ? therapist.name.trim().slice(0, 120)
          : "Removed profile";
      return [
        {
          id,
          name,
          cardClicks: count(therapist?.card_clicks),
          profileViews: count(therapist?.profile_views),
          bookClicks: count(therapist?.book_clicks),
          consultClicks: count(therapist?.consult_clicks),
        },
      ];
    }),
  };
}

export function analyticsLoadError(error: { code?: string; message?: string } | null) {
  const message = error?.message ?? "";
  if (
    error?.code === "PGRST202" ||
    /analytics_dashboard/i.test(message) ||
    /schema cache/i.test(message)
  ) {
    return "Analytics isn't available yet. Apply the site analytics migration, then reload this page.";
  }
  if (error?.code === "42501" || /admin access required/i.test(message)) {
    return "Admin access is required.";
  }
  return "Analytics isn't available right now.";
}

export async function loadAnalytics(
  supabase: SupabaseClient,
  days: AnalyticsWindow,
) {
  const { data, error } = await supabase.rpc("analytics_dashboard", {
    p_days: days,
  });
  if (error) throw error;
  return parseAnalyticsDashboard(data, days);
}
