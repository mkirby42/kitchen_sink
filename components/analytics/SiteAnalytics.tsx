"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackPageView } from "@/lib/analytics/track";

/** Page views for every route. Renders nothing. Skipped for admin accounts. */
export function SiteAnalytics({ enabled }: { enabled: boolean }) {
  const path = usePathname() || "/";

  useEffect(() => {
    if (!enabled) return;
    trackPageView(path);
  }, [enabled, path]);

  return null;
}
