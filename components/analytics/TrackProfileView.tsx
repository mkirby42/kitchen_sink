"use client";

import { useEffect } from "react";
import { trackProfileView } from "@/lib/analytics/track";

/** Fired only when a real profile rendered, not the not-found card. */
export function TrackProfileView({ therapistId }: { therapistId: string }) {
  useEffect(() => {
    trackProfileView(therapistId);
  }, [therapistId]);

  return null;
}
