import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join as a therapist",
};

export default function JoinPage() {
  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <p className="text-xs font-medium tracking-[0.2em] text-clay uppercase">
        Join as a therapist
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight">
        Let&apos;s start with <em className="text-clay">you</em>.
      </h1>
      <p className="mt-4 text-mute">
        Four-step onboarding (basic info, photo + intro video, practice tags,
        conversation cards) ships after auth. This page is the shell.
      </p>
    </main>
  );
}
