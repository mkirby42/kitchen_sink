"use client";

import { primaryPillClass } from "@/components/ui/styles";
import { trackCta } from "@/lib/analytics/track";

export function FindConsultLink({
  href,
  therapistId,
  cta,
}: {
  href: string;
  therapistId: string;
  cta: "consult" | "book";
}) {
  return (
    <a
      href={href}
      className={`${primaryPillClass} px-5 py-2.5`}
      onClick={() => trackCta(therapistId, cta)}
    >
      Book a free 15-min consult
    </a>
  );
}
