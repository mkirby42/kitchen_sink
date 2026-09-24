"use client";

import { useState } from "react";
import {
  centsToPriceInput,
  parsePriceDraft,
  sanitizePriceDraft,
} from "@/lib/join/price";

type RequiredCents = {
  cents: number;
  ariaLabel: string;
  onCents: (cents: number) => void;
  nullable?: false;
};

type OptionalCents = {
  cents: number | null;
  ariaLabel: string;
  onCents: (cents: number | null) => void;
  nullable: true;
};

export function RatePriceInput(props: RequiredCents | OptionalCents) {
  const { cents, ariaLabel } = props;
  const [draft, setDraft] = useState<string | null>(null);
  const shown = cents == null ? "" : centsToPriceInput(cents);

  function commit(next: number | null) {
    if (props.nullable) props.onCents(next);
    else if (next != null) props.onCents(next);
  }

  return (
    <label className="relative min-w-0 flex-1">
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
        value={draft ?? shown}
        onFocus={() => setDraft(shown)}
        onChange={(event) => {
          const next = sanitizePriceDraft(event.target.value);
          setDraft(next);
          const parsed = parsePriceDraft(next);
          if (parsed != null) commit(parsed);
          else if (props.nullable && next === "") commit(null);
        }}
        onBlur={() => {
          const parsed = parsePriceDraft(draft ?? "");
          if (parsed != null) commit(parsed);
          else if (draft === "") commit(props.nullable ? null : 0);
          setDraft(null);
        }}
        className="w-full bg-transparent py-1.5 pl-4 outline-none"
      />
    </label>
  );
}
