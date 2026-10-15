"use client";

import { useState } from "react";
import { sentenceCasePhrase } from "@/lib/copy/sentence-case";
import { softTagClass } from "@/components/ui/styles";

const VISIBLE = 6;

export function TagPills({ labels }: { labels: string[] }) {
  const [open, setOpen] = useState(false);
  if (labels.length === 0) return null;

  const shown = open ? labels : labels.slice(0, VISIBLE);
  const extra = labels.length - VISIBLE;

  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {shown.map((label) => (
        <li key={label} className={softTagClass}>
          {sentenceCasePhrase(label)}
        </li>
      ))}
      {!open && extra > 0 ? (
        <li>
          <button
            type="button"
            className={softTagClass}
            aria-expanded={false}
            onClick={() => setOpen(true)}
          >
            +{extra} more
          </button>
        </li>
      ) : null}
    </ul>
  );
}
