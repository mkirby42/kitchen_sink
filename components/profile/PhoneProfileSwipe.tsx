"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, type ReactNode } from "react";
import { useSwipeHint } from "@/components/search/useSwipeHint";
import { SWIPE_HINT, swipeForLabel } from "@/lib/search/phone-find";
import { credentialTitle } from "@/lib/therapists/display";

export type PhoneProfileBrowse = {
  index: number;
  count: number;
  allHref: string;
  prevHref: string | null;
  nextHref: string | null;
  nextName: string | null;
  nextCredential: string | null;
  nextAnswer: string | null;
};

export function PhoneProfileSwipe({
  browse,
  children,
}: {
  browse: PhoneProfileBrowse | null;
  children: ReactNode;
}) {
  const router = useRouter();
  const start = useRef<{ x: number; y: number } | null>(null);
  const hint = useSwipeHint(Boolean(browse));
  const nextLabel =
    browse?.nextHref != null
      ? swipeForLabel(browse.index + 2, browse.count)
      : null;

  return (
    <div
      onTouchStart={(event) => {
        const touch = event.changedTouches[0];
        if (!touch) return;
        start.current = { x: touch.clientX, y: touch.clientY };
      }}
      onTouchEnd={(event) => {
        if (!browse || !start.current) return;
        const touch = event.changedTouches[0];
        if (!touch) return;
        const dx = touch.clientX - start.current.x;
        const dy = touch.clientY - start.current.y;
        start.current = null;
        if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
        const href = dx < 0 ? browse.nextHref : browse.prevHref;
        if (!href) return;
        hint.dismiss();
        router.push(href);
      }}
    >
      {browse ? (
        <div data-phone-profile-browse="" className="mb-2 md:hidden">
          <div className="flex items-center justify-between gap-3">
            <Link
              href={browse.allHref}
              className="inline-flex items-center gap-1 font-sans text-[15px] font-medium text-heading"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                <path d="M15 5 8 12l7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              All {browse.count}
            </Link>
            <p className="font-sans text-sm text-mute" aria-live="polite">
              {browse.index + 1} of {browse.count}
            </p>
          </div>
          <div data-phone-progress="" className="mt-3 flex gap-1" aria-hidden>
            {Array.from({ length: browse.count }, (_, dot) => (
              <span
                key={dot}
                className={
                  dot <= browse.index
                    ? "h-1 flex-1 rounded-full bg-heading"
                    : "h-1 flex-1 rounded-full bg-heading/20"
                }
              />
            ))}
          </div>
          {hint.show ? (
            <p className="mt-3 text-center font-sans text-[13px] font-medium text-meta">
              {SWIPE_HINT}
            </p>
          ) : null}
          <div className="sr-only">
            {browse.prevHref ? (
              <Link href={browse.prevHref}>Previous therapist</Link>
            ) : null}
            {browse.nextHref ? (
              <Link href={browse.nextHref}>Next therapist</Link>
            ) : null}
          </div>
        </div>
      ) : null}
      {children}
      {browse && nextLabel && browse.nextName ? (
        <Link
          href={browse.nextHref ?? browse.allHref}
          className="mt-8 flex items-center justify-between gap-3 rounded-2xl border border-line bg-paper px-4 py-3 md:hidden"
        >
          <span>
            <span className="block font-sans text-[13px] font-medium text-heading">
              {nextLabel}
            </span>
            <span className="mt-0.5 block font-sans text-[15px] font-medium text-copy">
              {browse.nextName}
            </span>
            {browse.nextCredential ? (
              <span className="mt-0.5 block font-sans text-[13px] text-meta">
                {credentialTitle(browse.nextCredential) ?? browse.nextCredential}
              </span>
            ) : null}
            {browse.nextAnswer ? (
              <span className="mt-1 block line-clamp-2 font-sans text-[13px] text-meta">
                {browse.nextAnswer}
              </span>
            ) : null}
          </span>
        </Link>
      ) : null}
    </div>
  );
}
