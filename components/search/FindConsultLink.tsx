"use client";

import { primaryPillClass } from "@/components/ui/styles";
import { trackCta } from "@/lib/analytics/track";

export function FindConsultLink({
  href,
  therapistId,
  cta,
  label = "Book a free 15-min consult",
  tone = "primary",
}: {
  href: string;
  therapistId: string;
  cta: "consult" | "book";
  label?: string;
  tone?: "primary" | "paper";
}) {
  const className =
    tone === "paper"
      ? "inline-flex items-center rounded-full border border-line bg-paper px-5 py-2.5 font-sans text-[16px] font-medium text-ink"
      : `${primaryPillClass} px-5 py-2.5`;
  return (
    <a
      href={href}
      className={className}
      onClick={() => trackCta(therapistId, cta)}
    >
      {label}
    </a>
  );
}
