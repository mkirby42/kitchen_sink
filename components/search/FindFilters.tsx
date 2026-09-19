"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  INSURANCE_PRESETS,
  LICENSE_STATES,
  SPECIALTY_PRESETS,
} from "@/lib/tags/presets";
import type { SearchFilters } from "@/lib/search/rpc";
import { buildFindHref, filtersFromSearchParams } from "./query";

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={
        selected
          ? "rounded-full bg-clay px-4 py-2 text-sm font-medium text-paper hover:bg-clay-dark"
          : "rounded-full border border-line bg-paper px-4 py-2 text-sm font-medium text-ink hover:border-ink/20"
      }
    >
      {children}
    </button>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const id = `filter-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between rounded-full border border-line bg-paper px-5 py-3 text-left text-sm font-medium text-ink"
      >
        {title}
        <span aria-hidden className="text-lg leading-none text-mute">
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? (
        <div id={id} className="mt-3 flex flex-wrap gap-2">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function toggleTag(tags: string[], label: string) {
  return tags.includes(label)
    ? tags.filter((tag) => tag !== label)
    : [...tags, label];
}

export function FindFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = filtersFromSearchParams(searchParams);

  function apply(next: SearchFilters) {
    router.push(buildFindHref(next), { scroll: false });
  }

  const mustHaveCount = filters.tags.length + (filters.state ? 1 : 0);

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="text-xs font-medium uppercase tracking-[0.16em] text-mute">
          Session format
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip
            selected={filters.virtual}
            onClick={() => apply({ ...filters, virtual: !filters.virtual })}
          >
            Virtual
          </Chip>
          <Chip
            selected={filters.inPerson}
            onClick={() => apply({ ...filters, inPerson: !filters.inPerson })}
          >
            In-Person
          </Chip>
        </div>
      </fieldset>

      <FilterGroup title="Specialties">
        {SPECIALTY_PRESETS.map((label) => (
          <Chip
            key={label}
            selected={filters.tags.includes(label)}
            onClick={() =>
              apply({ ...filters, tags: toggleTag(filters.tags, label) })
            }
          >
            {label}
          </Chip>
        ))}
      </FilterGroup>

      <FilterGroup title="Insurance">
        {INSURANCE_PRESETS.map((label) => (
          <Chip
            key={label}
            selected={filters.tags.includes(label)}
            onClick={() =>
              apply({ ...filters, tags: toggleTag(filters.tags, label) })
            }
          >
            {label}
          </Chip>
        ))}
      </FilterGroup>

      <FilterGroup title="State licensed in">
        <label className="sr-only" htmlFor="license-state">
          License state
        </label>
        <select
          id="license-state"
          value={filters.state ?? ""}
          onChange={(event) =>
            apply({ ...filters, state: event.target.value || null })
          }
          className={
            filters.state
              ? "rounded-full bg-clay px-4 py-2 text-sm font-medium text-paper"
              : "rounded-full border border-line bg-paper px-4 py-2 text-sm font-medium text-ink"
          }
        >
          <option value="">Any state</option>
          {LICENSE_STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </FilterGroup>

      <div className="flex items-center justify-between gap-4 text-sm">
        <p className="text-mute">
          {mustHaveCount} must-have{mustHaveCount === 1 ? "" : "s"} selected
        </p>
        <button
          type="button"
          onClick={() =>
            apply({ tags: [], virtual: false, inPerson: false, state: null })
          }
          className="font-medium text-clay hover:text-clay-dark"
        >
          Clear all
        </button>
      </div>
    </div>
  );
}
