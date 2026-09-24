import Link from "next/link";
import { routes } from "@/lib/routes";

export function ProfileDeleted() {
  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <p className="text-xs font-semibold tracking-[0.2em] text-clay uppercase">
        Profile deleted
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight">
        Your therapist profile is gone.
      </h1>
      <p className="mt-4 text-mute">
        It no longer appears in Find or on a public therapist page. Your login
        is still active, so you can publish a new profile whenever you want.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={routes.home}
          className="rounded-full bg-clay px-5 py-3 font-medium text-paper hover:bg-clay-dark"
        >
          Home
        </Link>
        <Link
          href={routes.join}
          className="rounded-full border border-line bg-paper px-5 py-3 font-medium text-ink hover:border-ink/20"
        >
          Join again
        </Link>
      </div>
    </main>
  );
}
