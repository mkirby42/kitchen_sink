"use client";

import Link from "next/link";
import { routes } from "@/lib/routes";

export function JoinShell({
  step,
  onBack,
  closeHref = routes.home,
  children,
  footer,
}: {
  step?: 1 | 2 | 3 | 4;
  onBack?: () => void;
  closeHref?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const chromeBtn =
    "grid size-10 shrink-0 place-items-center rounded-full bg-cream text-xl text-ink hover:bg-line";

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6 sm:py-16">
      <section className="overflow-hidden rounded-[2rem] bg-paper shadow-[0_24px_70px_rgba(27,39,68,0.12)]">
        <div className="flex items-center gap-4 px-5 pt-5 sm:px-8 sm:pt-7">
          {onBack ? (
            <button
              type="button"
              aria-label="Go back"
              onClick={onBack}
              className={chromeBtn}
            >
              ←
            </button>
          ) : (
            <Link href={routes.home} aria-label="Go home" className={chromeBtn}>
              ←
            </Link>
          )}

          <div
            className="flex flex-1 justify-center gap-1.5"
            aria-label={step ? `Step ${step} of 4` : "Join"}
          >
            {[1, 2, 3, 4].map((segment) => (
              <span
                key={segment}
                className={`h-1 w-8 rounded-full ${
                  step && segment <= step ? "bg-clay" : "bg-line"
                }`}
              />
            ))}
          </div>

          <Link href={closeHref} aria-label="Close" className={chromeBtn}>
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
