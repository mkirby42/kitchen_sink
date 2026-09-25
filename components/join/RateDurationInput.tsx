"use client";

import { useState } from "react";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "").slice(0, 3);
}

export function RateDurationInput({
  minutes,
  ariaLabel,
  onMinutes,
}: {
  minutes: number;
  ariaLabel: string;
  onMinutes: (minutes: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = minutes > 0 ? String(minutes) : "";

  function commit(raw: string) {
    if (raw === "") {
      onMinutes(0);
      return;
    }
    const parsed = Number(raw);
    if (Number.isInteger(parsed)) onMinutes(parsed);
  }

  return (
    <label className="flex min-w-0 items-center gap-1">
      <span className="sr-only">Session length</span>
      <input
        aria-label={ariaLabel}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        value={draft ?? shown}
        onFocus={() => setDraft(shown)}
        onChange={(event) => {
          const next = digitsOnly(event.target.value);
          setDraft(next);
          commit(next);
        }}
        onBlur={() => {
          commit(draft ?? shown);
          setDraft(null);
        }}
        className="w-full min-w-0 bg-transparent py-1.5 text-right outline-none"
      />
      <span className="shrink-0 text-mute" aria-hidden>
        min
      </span>
    </label>
  );
}
