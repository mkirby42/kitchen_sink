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
  return active
    ? "text-ink font-medium"
    : "text-ink/80 hover:text-ink";
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

    const supabase = createClient();

    async function loadNavUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setNavUser(null);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      const role = parseProfileRole(profile?.role);

      setNavUser({ id: user.id, role });
    }

    void loadNavUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadNavUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(routes.home);
    router.refresh();
  }

  // Profile and join use their own phone-width chrome (back + wordmark / stepper).
  if (path.startsWith("/t/") || path === routes.join) {
    return null;
  }

  const therapist = navUser?.role === "therapist" ? navUser : null;
  const admin = navUser?.role === "admin" ? navUser : null;

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
        <nav className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-sm">
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
          {!navUser ? (
            <Link
              href={routes.join}
              className="rounded-full bg-clay px-4 py-2 font-medium text-paper hover:bg-clay-dark"
            >
              Join as a Therapist
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
          ) : null}
        </nav>
      </div>
    </header>
  );
}
