"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

export function SiteHeader({
  initialNavUser = null,
}: {
  initialNavUser?: NavUser | null;
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

  // Profile, join, and password reset use their own phone-width chrome.
  if (
    path.startsWith("/t/") ||
    path === routes.join ||
    path === routes.forgotPassword ||
    path === routes.resetPassword
  ) {
    return null;
  }

  const admin = navUser?.role === "admin" ? navUser : null;
  const therapist =
    navUser &&
    (navUser.role === "therapist" || (admin && navUser.hasTherapist))
      ? navUser
      : null;

  const showTherapistEntry = !navUser || Boolean(admin);

  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
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
          {admin ? (
            <Link
              href={routes.adminMedia}
              className={navClass(path === routes.adminMedia)}
              aria-current={path === routes.adminMedia ? "page" : undefined}
            >
              Uploads
            </Link>
          ) : null}
          {admin ? (
            <Link
              href={routes.adminReviews}
              className={navClass(path === routes.adminReviews)}
              aria-current={path === routes.adminReviews ? "page" : undefined}
            >
              Reviews
            </Link>
          ) : null}
          {showTherapistEntry ? (
            <Link href={routes.join} className={navClass(false)}>
              For Therapists
            </Link>
          ) : null}
          {therapist ? (
            <Link
              href={routes.therapist(therapist.id)}
              className="rounded-full bg-clay px-4 py-2 font-medium text-paper hover:bg-clay-dark"
            >
              My profile
            </Link>
          ) : null}
          {navUser ? (
            <button
              type="button"
              onClick={() => void signOut()}
              className={navClass(false)}
            >
              Sign out
            </button>
          ) : (
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
          )}
        </nav>
      </div>
    </header>
  );
}
