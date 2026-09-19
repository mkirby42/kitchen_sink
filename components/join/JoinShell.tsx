"use client";

import Link from "next/link";
import { routes } from "@/lib/routes";

export function JoinShell({
  step,
  onBack,
  children,
  footer,
}: {
  step?: 1 | 2 | 3 | 4;
  onBack?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8 sm:px-6 sm:py-12">
      <section className="overflow-hidden rounded-[2rem] bg-paper shadow-[0_24px_70px_rgba(27,39,68,0.12)]">
        <div className="flex items-center gap-5 px-6 pt-6 sm:px-10 sm:pt-8">
          {onBack ? (
            <button
              type="button"
              aria-label="Go back"
              onClick={onBack}
              className="grid size-10 shrink-0 place-items-center rounded-full border border-line text-xl text-ink hover:border-clay hover:text-clay"
            >
              ←
            </button>
          ) : (
            <Link
              href={routes.home}
              aria-label="Go home"
              className="grid size-10 shrink-0 place-items-center rounded-full border border-line text-xl text-ink hover:border-clay hover:text-clay"
            >
              ←
            </Link>
          )}

          <div className="flex flex-1 gap-2" aria-label={step ? `Step ${step} of 4` : "Join"}>
            {[1, 2, 3, 4].map((segment) => (
              <span
                key={segment}
                className={`h-1.5 flex-1 rounded-full ${
                  step && segment <= step ? "bg-clay" : "bg-line"
                }`}
              />
            ))}
          </div>

          <Link
            href={routes.home}
            aria-label="Close"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-line text-xl text-ink hover:border-clay hover:text-clay"
          >
            ×
          </Link>
        </div>

        <div className="px-6 py-8 sm:px-10 sm:py-10">{children}</div>
        {footer ? (
          <div className="sticky bottom-0 border-t border-line bg-paper/95 px-6 py-5 backdrop-blur sm:px-10">
            {footer}
          </div>
        ) : null}
      </section>
    </main>
  );
}
