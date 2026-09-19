"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { routes } from "@/lib/routes";

function navClass(active: boolean) {
  return active
    ? "text-ink font-medium"
    : "text-ink/80 hover:text-ink";
}

export function SiteHeader() {
  const path = usePathname();

  // Profile and join use their own phone-width chrome (back + wordmark / stepper).
  if (path.startsWith("/t/") || path === routes.join) {
    return null;
  }

  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href={routes.home}
          className="font-display text-2xl tracking-tight text-ink"
        >
          Kitchen Sink
          <span className="ml-1 inline-block text-base text-clay" aria-hidden>
            ✦
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href={routes.home}
            className={navClass(path === routes.home)}
            aria-current={path === routes.home ? "page" : undefined}
          >
            Home
          </Link>
          <Link
            href={routes.find}
            className={navClass(path === routes.find)}
            aria-current={path === routes.find ? "page" : undefined}
          >
            Find a Therapist
          </Link>
          <Link
            href={routes.join}
            className="rounded-full bg-clay px-4 py-2 font-medium text-paper hover:bg-clay-dark"
          >
            Join as a Therapist
          </Link>
        </nav>
      </div>
    </header>
  );
}
