"use client";

import { useState } from "react";
import { ContactSheet } from "@/components/profile/ContactSheet";
import { primaryPillClass } from "@/components/ui/styles";
import { trackCta } from "@/lib/analytics/track";
import { givenName } from "@/lib/therapists/display";
import type { ContactAction } from "@/lib/therapists/load";

export function FindConsultLink({
  therapistId,
  cta,
  label = "Book a free 15-min consult",
  tone = "primary",
  name,
  contact,
}: {
  therapistId: string;
  cta: "consult" | "book";
  label?: string;
  tone?: "primary" | "paper";
  name: string;
  contact: readonly ContactAction[];
}) {
  const [open, setOpen] = useState(false);
  if (contact.length === 0) return null;
  const className =
    tone === "paper"
      ? "inline-flex cursor-pointer items-center rounded-full border border-line bg-paper px-5 py-2.5 font-sans text-[16px] font-medium text-ink"
      : `${primaryPillClass} cursor-pointer px-5 py-2.5`;
  return (
    <>
      <button
        type="button"
        className={className}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          trackCta(therapistId, cta);
          setOpen(true);
        }}
      >
        {label}
      </button>
      <ContactSheet
        open={open}
        name={givenName(name)}
        contact={contact}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
