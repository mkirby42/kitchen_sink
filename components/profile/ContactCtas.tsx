"use client";

import { useEffect, useId, useState } from "react";
import type { ConsultBookAction, ContactAction } from "@/lib/therapists/load";

export function ContactCtas({
  name,
  actions,
  contact,
}: {
  name: string;
  actions: ConsultBookAction[];
  contact: ContactAction[];
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (actions.length === 0 || contact.length === 0) return null;

  return (
    <>
      <div
        className={
          actions.length > 1
            ? "mt-4 grid grid-cols-2 gap-3"
            : "mt-4 grid grid-cols-1"
        }
      >
        {actions.map((action) => (
          <button
            key={action.kind}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className={
              action.kind === "book"
                ? "flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-clay px-3 py-[0.95rem] text-[15px] font-semibold text-paper hover:bg-clay-dark"
                : "flex items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-pine bg-paper px-3 py-[0.95rem] text-[15px] font-semibold text-pine hover:bg-pine/5"
            }
          >
            {action.kind === "consult" ? <ConsultIcon /> : <BookIcon />}
            {action.label}
          </button>
        ))}
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 px-4 py-6 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-sm rounded-[1.75rem] bg-paper px-5 py-6 shadow-[0_24px_70px_rgba(27,39,68,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-[11px] font-semibold tracking-[0.14em] text-clay uppercase">
              Contact
            </p>
            <h2 id={titleId} className="mt-1 font-display text-2xl text-ink">
              Reach {name}
            </h2>
            <p className="mt-1 text-sm text-mute">
              Kitchen Sink doesn&apos;t book sessions — use the details they
              listed.
            </p>
            <ul className="mt-5 space-y-2">
              {contact.map((item) => (
                <li key={item.kind}>
                  <a
                    href={item.href}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-cream px-4 py-3 text-ink hover:bg-line"
                  >
                    <span>
                      <span className="block text-[11px] font-semibold tracking-[0.14em] text-mute uppercase">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block font-medium break-all">
                        {item.value}
                      </span>
                    </span>
                    <span className="text-sm text-clay" aria-hidden>
                      →
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 w-full rounded-full border border-line px-4 py-3 text-sm font-semibold text-ink hover:bg-cream"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
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
