"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { trackCta } from "@/lib/analytics/track";
import type { ConsultBookAction, ContactAction } from "@/lib/therapists/load";
import { ContactSheet } from "./ContactSheet";

export function ContactCtas({
  name,
  actions,
  contact,
  therapistId,
  placement = "responsive",
}: {
  name: string;
  actions: ConsultBookAction[];
  contact: ContactAction[];
  therapistId?: string;
  /** responsive: md+ grid and a phone dock. stack: name-card row, no dock. */
  placement?: "responsive" | "stack";
}) {
  const [open, setOpen] = useState(false);

  if (actions.length === 0 || contact.length === 0) return null;

  const columns =
    actions.length > 1 ? "grid-cols-2 gap-3" : "grid-cols-1";

  return (
    <>
      {placement === "stack" ? (
        <div data-cta-placement="stack" className={`mt-4 grid ${columns}`}>
          {actions.map((action) => (
            <CtaButton
              key={action.kind}
              action={action}
              therapistId={therapistId}
              open={open}
              onOpen={() => setOpen(true)}
              size="md"
            />
          ))}
        </div>
      ) : (
        <>
          <div
            data-cta-placement="inline"
            className={`mt-4 hidden md:grid ${columns}`}
          >
            {actions.map((action) => (
              <CtaButton
                key={action.kind}
                action={action}
                therapistId={therapistId}
                open={open}
                onOpen={() => setOpen(true)}
              />
            ))}
          </div>

          <div
            data-cta-placement="dock"
            className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-cream pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(27,39,68,0.06)] md:hidden"
          >
            <div className={`mx-auto grid w-full max-w-6xl px-5 sm:px-8 ${columns}`}>
              {actions.map((action) => (
                <CtaButton
                  key={action.kind}
                  action={action}
                  therapistId={therapistId}
                  open={open}
                  onOpen={() => setOpen(true)}
                />
              ))}
            </div>
          </div>
        </>
      )}

      <ContactSheet
        open={open}
        name={name}
        contact={contact}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

function CtaButton({
  action,
  therapistId,
  open,
  onOpen,
  size = "sm",
}: {
  action: ConsultBookAction;
  therapistId?: string;
  open: boolean;
  onOpen: () => void;
  size?: "sm" | "md";
}) {
  return (
    <Button
      variant={action.kind === "book" ? "solid" : "secondary"}
      size={size === "sm" ? "dock" : "label"}
      className="w-full whitespace-nowrap"
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={() => {
        if (therapistId) trackCta(therapistId, action.kind);
        onOpen();
      }}
    >
      {action.kind === "consult" ? <ConsultIcon /> : <BookIcon />}
      {action.label}
    </Button>
  );
}

function ConsultIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <path
        d="M6 7.25A3.25 3.25 0 0 1 9.25 4h5.5A3.25 3.25 0 0 1 18 7.25v4.5A3.25 3.25 0 0 1 14.75 15H11l-3.5 3v-3H9.25A3.25 3.25 0 0 1 6 11.75v-4.5Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <rect x="4.5" y="5.5" width="15" height="14" rx="2" />
      <path d="M4.5 10h15M8 3.5v4M16 3.5v4" strokeLinecap="round" />
    </svg>
  );
}
