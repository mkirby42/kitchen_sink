import Link from "next/link";
import { routes } from "@/lib/routes";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <p className="font-display text-lg text-clay">Kitchen Sink</p>
      <h1 className="mt-3 font-display text-5xl leading-tight tracking-tight">
        Find a therapist who actually{" "}
        <em className="text-clay">fits</em>.
      </h1>
      <p className="mt-6 max-w-xl text-lg text-mute">
        Tap the tags you need. We show therapists who match some of them.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href={routes.find}
          className="rounded-full bg-clay px-5 py-3 font-medium text-paper hover:bg-clay-dark"
        >
          Find a therapist
        </Link>
        <Link
          href={routes.join}
          className="rounded-full border border-line bg-paper px-5 py-3 font-medium text-ink hover:border-ink/20"
        >
          Join as a therapist
        </Link>
      </div>
    </main>
  );
}
