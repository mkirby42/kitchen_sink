"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "ks_referral_how_it_works";

const listeners = new Set<() => void>();
let memory: boolean | null = null;

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function readOpen() {
  if (memory !== null) return memory;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
}

function getServerSnapshot() {
  return true;
}

function writeOpen(open: boolean) {
  memory = open;
  try {
    window.localStorage.setItem(STORAGE_KEY, open ? "1" : "0");
  } catch {
    // Private mode can throw. The in-memory choice still applies this visit.
  }
  listeners.forEach((listener) => listener());
}

const steps = [
  {
    n: "01",
    title: "Post a referral",
    body: "Choose age, focus, payment, format, and timing from the lists. No names or identifying details. Your client should already know you're looking.",
    icon: ListIcon,
  },
  {
    n: "02",
    title: "We approve it",
    body: "The post stays off the board until Kitchen Sink approves it. Then it stays up for one week.",
    icon: ApproveIcon,
  },
  {
    n: "03",
    title: "Therapists tap interested",
    body: "Other therapists with a published profile can tap I'm interested. You see who responded. You can't tap your own post.",
    icon: PeopleIcon,
  },
  {
    n: "04",
    title: "You follow up off the board",
    body: "From Who's interested, email your client from your own mail app. Booking stays off Kitchen Sink.",
    icon: MailIcon,
  },
  {
    n: "05",
    title: "Refresh after the week",
    body: "Refresh the same request from My referrals. It goes back up for another week, with no second approval.",
    icon: RefreshIcon,
  },
] as const;

/**
 * Same gold step cards as the therapist-start “How it works”.
 * Open on first visit. Hide leaves the heading so it can be opened again.
 */
export function ReferralHowItWorks() {
  const open = useSyncExternalStore(subscribe, readOpen, getServerSnapshot);

  function toggle() {
    writeOpen(!open);
  }

  return (
    <section
      aria-labelledby="referral-how-title"
      className="mb-4 rounded-card bg-gold/35 px-4 py-5 sm:px-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="referral-how-title"
          className="font-display text-[1.65rem] tracking-tight text-black"
        >
          How it works
        </h2>
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-ink hover:bg-paper/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          aria-expanded={open}
          aria-controls="referral-how-steps"
          onClick={toggle}
        >
          {open ? "Hide" : "Show"}
          <Chevron open={open} />
        </button>
      </div>
      <div id="referral-how-steps" className={open ? "mt-4" : "hidden"}>
        <ol className="space-y-3">
          {steps.map((step) => (
            <li key={step.n} className="flex gap-3 rounded-box bg-paper p-3 shadow-card">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lavender text-ink">
                <step.icon />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-black">
                  {step.n} — {step.title}
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-body">
                  {step.body}
                </span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm leading-relaxed text-body">
          Only signed-in therapists with a published profile can see this board.
          Kitchen Sink stores no client name, email, or phone.
        </p>
      </div>
    </section>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`h-4 w-4 ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden
    >
      <path d="M3.5 6.2 8 10.2 12.5 6.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M8 7.5h10M8 12h10M8 16.5h10" strokeLinecap="round" />
      <path d="M4.8 7.5h.01M4.8 12h.01M4.8 16.5h.01" strokeLinecap="round" />
    </svg>
  );
}

function ApproveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9.5A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5Z" strokeLinejoin="round" />
      <path d="M14 3.8V8h4" strokeLinejoin="round" />
      <path d="m8.5 13.5 2.2 2.2 4-4.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <circle cx="9" cy="8.2" r="2.4" />
      <path d="M4.6 18c.7-2.4 2.2-3.6 4.4-3.6s3.7 1.2 4.4 3.6" strokeLinecap="round" />
      <circle cx="16.2" cy="9" r="2" />
      <path d="M15.2 14.5c1.6.2 2.8 1.1 3.6 2.7" strokeLinecap="round" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7.5 7.5 6 7.5-6" strokeLinejoin="round" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M19 12a7 7 0 0 1-11.8 5.1" strokeLinecap="round" />
      <path d="M5 12a7 7 0 0 1 11.8-5.1" strokeLinecap="round" />
      <path d="M19 6.5V12h-5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 17.5V12h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
