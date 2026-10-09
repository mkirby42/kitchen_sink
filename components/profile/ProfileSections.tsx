import type { ReactNode } from "react";
import { AccountShell } from "@/components/auth/AccountShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
    return { icon: "↑", tone: "bg-lavender text-ink" };
  }
  if (tag === "session_vibe") {
    return { icon: "◷", tone: "bg-gold/35 text-ink" };
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
      tone: "bg-clay/15 text-ink",
    };
  }
  return { icon: "✦", tone: "bg-ink/10 text-ink" };
}

export function ProfileNotFound({ backHref }: { backHref: string }) {
  return (
    <AccountShell
      eyebrow="Therapist profile"
      title="We couldn't find that therapist."
      lede="They may have closed their practice to new clients, be hidden from Find, or the link is out of date."
    >
      <div className="flex justify-center">
        <Button href={backHref}>Back to search</Button>
      </div>
    </AccountShell>
  );
}
