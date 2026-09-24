"use client";

import { useState } from "react";
import {
  centsToPriceInput,
  parsePriceDraft,
  sanitizePriceDraft,
} from "@/lib/join/price";

export function RatePriceInput({
  cents,
  ariaLabel,
  onCents,
}: {
  cents: number;
  ariaLabel: string;
  onCents: (cents: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <label className="relative min-w-0">
      <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-mute">
        $
      </span>
      <span className="sr-only">Price in dollars</span>
      <input
        aria-label={ariaLabel}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        value={draft ?? centsToPriceInput(cents)}
        onFocus={() => setDraft(centsToPriceInput(cents))}
        onChange={(event) => {
          const next = sanitizePriceDraft(event.target.value);
          setDraft(next);
          const parsed = parsePriceDraft(next);
          if (parsed != null) onCents(parsed);
        }}
        onBlur={() => {
          const parsed = parsePriceDraft(draft ?? "");
          if (parsed != null) onCents(parsed);
          else if (draft === "") onCents(0);
          setDraft(null);
        }}
        className="w-full bg-transparent py-1.5 pl-4 outline-none"
      />
    </label>
  );
}
