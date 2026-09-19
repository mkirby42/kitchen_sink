import type { Metadata } from "next";
import Link from "next/link";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Find a therapist",
};

export default function FindPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-4xl tracking-tight">
        Find your <em className="text-clay">therapist</em>
      </h1>
      <p className="mt-3 text-mute">
        Must-have filters land next. Search will only return therapists who
        match every tag you tap.
      </p>
      <p className="mt-8 text-sm text-mute">
        Sample profile while data is empty:{" "}
        <Link className="text-clay underline" href={routes.therapist("maya")}>
          Dr. Maya Chen
        </Link>
      </p>
    </main>
  );
}
