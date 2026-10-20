import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { softTagClass, cx, pageSubtitleClass, profilePageHeadingClass } from "@/components/ui/styles";
import type { ReferralPill } from "@/lib/referrals/match";

export function ReferralShell({
  eyebrow,
  title,
  lede,
  action,
  children,
  wide = false,
}: {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <main
      className={cx(
        "mx-auto w-full px-4 py-8 sm:px-6 sm:py-12",
        wide ? "max-w-3xl" : "max-w-xl",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          <h1 className={cx(profilePageHeadingClass, "text-black", eyebrow && "mt-2")}>
            {title}
          </h1>
        </div>
        {action}
      </div>
      {lede ? <div className={cx(pageSubtitleClass, "mt-3 max-w-xl")}>{lede}</div> : null}
      <div className="mt-6">{children}</div>
    </main>
  );
}

export function ReferralPills({ pills }: { pills: ReferralPill[] }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {pills.map((pill) => (
        <li key={pill.label} className={cx(softTagClass, "gap-1")}>
          {pill.matched ? <Check /> : null}
          {pill.label}
        </li>
      ))}
    </ul>
  );
}

export function Check() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" aria-hidden>
      <path
        d="M3.2 8.2 6.4 11.4 12.8 4.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Initials({ name }: { name: string }) {
  const letters = name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lavender font-sans text-sm font-medium text-ink">
      {letters || "T"}
    </span>
  );
}
