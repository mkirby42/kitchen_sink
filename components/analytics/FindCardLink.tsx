"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { trackCardClick } from "@/lib/analytics/track";

export function FindCardLink({
  therapistId,
  onClick,
  ...props
}: ComponentProps<typeof Link> & { therapistId: string }) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        trackCardClick(therapistId);
      }}
    />
  );
}
