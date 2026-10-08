"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AudienceSwitcher } from "@/components/AudienceSwitcher";
import { Button } from "@/components/ui/Button";
import { headerChrome, type SiteAudience } from "@/lib/audience";
import type { NavUser } from "@/lib/nav";
import { parseProfileRole } from "@/lib/role";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { supabasePublicConfig } from "@/lib/supabase/env";

function navClass(active: boolean) {
  return active ? "font-medium text-ink" : "text-ink/80 hover:text-ink";
}

function Sparkle() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="ml-1 inline-block h-[0.55em] w-[0.55em] -translate-y-[0.28em] text-clay"
      aria-hidden
    >
      <path
        fill="currentColor"
        d="M8 0.4 9.15 6.05 14.8 8 9.15 9.95 8 15.6 6.85 9.95 1.2 8 6.85 6.05Z"
      />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <circle cx="12" cy="8" r="3.25" />
      <path
        d="M5.5 19.25c1.15-3.05 3.35-4.5 6.5-4.5s5.35 1.45 6.5 4.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Join steps hide the site header. Account pages and therapist profiles do not. */
export function siteNavHidden(
  path: string,
  user: { role: string | null } | null,
) {
  return path === routes.join && user != null && user.role !== "patient";
}

export function SiteHeader({
  initialNavUser = null,
  audience = "admin",
}: {
  initialNavUser?: NavUser | null;
  audience?: SiteAudience;
}) {
  const path = usePathname();
  const router = useRouter();
  const [navUser, setNavUser] = useState<NavUser | null>(initialNavUser);

  useEffect(() => {
    if (!supabasePublicConfig()) return;
    // The reset page exchanges the email code itself. A second client would
    // consume that code first and the form would look expired.
    if (path === routes.resetPassword) return;

    const supabase = createClient();

    async function loadNavUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setNavUser(null);
        return;
      }

      const [{ data: profile }, { data: therapist }] = await Promise.all([
        supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
        supabase
          .from("therapists")
          .select("profile_id")
          .eq("profile_id", user.id)
          .maybeSingle(),
      ]);

      const role = parseProfileRole(profile?.role);

      setNavUser({ id: user.id, role, hasTherapist: Boolean(therapist) });
    }

    void loadNavUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadNavUser();
    });

    return () => subscription.unsubscribe();
  }, [path]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(routes.home);
    router.refresh();
  }

  const chrome = headerChrome({
    role: navUser?.role ?? null,
    hasTherapist: Boolean(navUser?.hasTherapist),
    audience,
  });
  const switcher = chrome.switcher ? (
    <AudienceSwitcher audience={audience} />
  ) : null;

  // Join steps use their own chrome.
  // Admins still get the switcher there so Therapist/Client preview can return.
  // Therapist profiles and account pages use this header.
  if (siteNavHidden(path, navUser)) {
    if (!switcher) return null;
    return (
      <div className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-6xl justify-end px-5 py-2 sm:px-8">
          {switcher}
        </div>
      </div>
    );
  }

  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={routes.home}
            className="shrink-0 font-display text-2xl tracking-tight text-ink"
          >
            Kitchen Sink
            <Sparkle />
          </Link>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm sm:justify-end sm:gap-x-6">
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
            {chrome.uploads ? (
              <Link
                href={routes.adminMedia}
                className={navClass(path === routes.adminMedia)}
                aria-current={path === routes.adminMedia ? "page" : undefined}
              >
                Uploads
              </Link>
            ) : null}
            {chrome.reviews ? (
              <Link
                href={routes.adminReviews}
                className={navClass(path === routes.adminReviews)}
                aria-current={path === routes.adminReviews ? "page" : undefined}
              >
                Reviews
              </Link>
            ) : null}
            {chrome.forTherapists ? (
              <Link href={routes.join} className={navClass(false)}>
                For Therapists
              </Link>
            ) : null}
            {chrome.myProfile && navUser ? (
              <Button href={routes.therapist(navUser.id)}>My profile</Button>
            ) : null}
            {chrome.signOut ? (
              <button
                type="button"
                onClick={() => void signOut()}
                className={navClass(false)}
              >
                Sign out
              </button>
            ) : null}
            {chrome.therapistLogin ? (
              <>
                <span
                  className="hidden h-4 w-px shrink-0 bg-ink/20 sm:block"
                  aria-hidden
                />
                <Link
                  href={routes.joinSignIn}
                  className="inline-flex items-center gap-1.5 text-ink/80 hover:text-ink"
                >
                  <PersonIcon />
                  Therapist log in
                </Link>
              </>
            ) : null}
          </nav>
        </div>
        {switcher ? <div className="flex sm:justify-end">{switcher}</div> : null}
      </div>
    </header>
  );
}
