"use client";

import { useEffect, useId } from "react";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { pageSubtitleClass, profileSectionHeadingClass } from "@/components/ui/styles";
import type { ContactAction } from "@/lib/therapists/load";

/** Listed email, call, and text. The booking buttons open this; only a row leaves the site. */
export function ContactSheet({
  open,
  name,
  contact,
  onClose,
}: {
  open: boolean;
  name: string;
  contact: readonly ContactAction[];
  onClose: () => void;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || contact.length === 0) return null;

  return (
    <div
      data-contact-sheet=""
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 px-4 py-6 sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-sm rounded-card bg-paper px-6 py-6 shadow-overlay"
        onClick={(event) => event.stopPropagation()}
      >
        <Eyebrow>Contact</Eyebrow>
        <h2 id={titleId} className={`mt-1 ${profileSectionHeadingClass}`}>
          Reach {name}
        </h2>
        <p className={`mt-1 ${pageSubtitleClass}`}>
          Kitchen Sink doesn&apos;t book sessions — use the details they listed.
        </p>
        <ul className="mt-5 space-y-2">
          {contact.map((item) => (
            <li key={item.kind}>
              <a
                href={item.href}
                className="flex items-center justify-between gap-3 rounded-2xl bg-cream px-4 py-3 text-body hover:bg-line"
              >
                <span>
                  <span className="block text-sm text-mute">{item.label}</span>
                  <span className="mt-0.5 block font-medium break-all">{item.value}</span>
                </span>
                <span className="text-sm text-clay" aria-hidden>
                  →
                </span>
              </a>
            </li>
          ))}
        </ul>
        <Button variant="secondary" className="mt-5 w-full" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
