import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { eyebrowClass, tagClass } from "@/components/ui/styles";

export function TagSection({ title, labels }: { title: string; labels: string[] }) {
  if (labels.length === 0) return null;
  return (
    <Card className="mt-4 px-5 py-5 sm:px-6">
      <h2 className={eyebrowClass}>{title}</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {labels.map((label) => (
          <li key={label} className={tagClass(false)}>
            {label}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function cardCorner(tag: string): { icon: ReactNode; tone: string } {
  if (tag === "approach") {
    return { icon: "↑", tone: "bg-[#f3ddd3] text-clay" };
  }
  if (tag === "session_vibe") {
    return { icon: "◷", tone: "bg-[#dceee6] text-[#3f6d5c]" };
  }
  if (tag === "specialty") {
    return {
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M8 4.5h6.5L18 8v11.5H8A1.5 1.5 0 0 1 6.5 18V6A1.5 1.5 0 0 1 8 4.5Z" />
          <path d="M14.5 4.5V8H18" />
        </svg>
      ),
      tone: "bg-[#f6e4d8] text-clay",
    };
  }
  return { icon: "✦", tone: "bg-ink/10 text-ink" };
}

export function ProfileNotFound({ backHref }: { backHref: string }) {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8">
      <Eyebrow>Therapist profile</Eyebrow>
      <h1 className="mt-3 max-w-xl font-display text-4xl tracking-tight text-ink">
        We couldn&apos;t find that therapist.
      </h1>
      <p className="mt-4 max-w-xl text-mute">
        They may have closed their practice to new clients, be hidden from
        Find, or the link is out of date.
      </p>
      <Button href={backHref} className="mt-8">
        Back to search
      </Button>
    </main>
  );
}
