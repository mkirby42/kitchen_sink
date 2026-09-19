"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  INSURANCE_PRESETS,
  SEARCH_SPECIALTY_MAX_LENGTH,
  filterLicenseStates,
  licenseStateLabel,
  normalizeSpecialtyFilterLabel,
  resolveLicenseState,
  specialtyFilterChips,
} from "@/lib/tags/presets";
import type { SearchFilters } from "@/lib/search/rpc";
import { buildFindHref, filtersFromSearchParams } from "./query";

function chipClass(selected: boolean) {
  return selected
    ? "rounded-full border border-clay bg-clay px-3.5 py-1.5 text-sm font-medium whitespace-nowrap text-paper hover:bg-clay-dark"
    : "rounded-full border border-line bg-paper px-3.5 py-1.5 text-sm font-medium whitespace-nowrap text-ink hover:border-ink/25";
}

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
      className={chipClass(selected)}
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
        className="flex w-full items-center justify-between rounded-full border border-line bg-paper px-5 py-2.5 text-left text-sm font-medium text-ink"
      >
        {title}
        <span aria-hidden className="text-lg leading-none text-mute">
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? (
        <div id={id} className="mt-3 flex flex-wrap items-center gap-2">
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

function StateLicensePicker({
  state,
  onSelect,
}: {
  state: string | null;
  onSelect: (state: string | null) => void;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const matches = filterLicenseStates(query);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  if (state) {
    return (
      <Chip selected onClick={() => onSelect(null)}>
        {licenseStateLabel(state)} · {state}
      </Chip>
    );
  }

  function choose(code: string) {
    onSelect(code);
    setQuery("");
    setOpen(false);
  }

  function submitTyped() {
    const code = resolveLicenseState(query) ?? matches[active]?.code;
    if (code) choose(code);
  }

  return (
    <div ref={rootRef} className="relative w-full max-w-sm">
      <label className="sr-only" htmlFor={`${listId}-input`}>
        Search license state
      </label>
      <input
        id={`${listId}-input`}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && matches[active] ? `${listId}-${matches[active].code}` : undefined
        }
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActive((index) =>
              matches.length ? (index + 1) % matches.length : 0,
            );
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
            setActive((index) =>
              matches.length
                ? (index - 1 + matches.length) % matches.length
                : 0,
            );
          } else if (event.key === "Enter") {
            event.preventDefault();
            submitTyped();
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder="Search state (California or CA)"
        autoComplete="off"
        className="w-full rounded-full border border-line bg-paper px-4 py-2 text-sm text-ink outline-none placeholder:text-mute focus:border-clay"
      />
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-10 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-line bg-paper py-1 shadow-[0_12px_32px_-16px_rgba(27,39,68,0.35)]"
        >
          {matches.length === 0 ? (
            <li className="px-4 py-2.5 text-sm text-mute">No matching state</li>
          ) : (
            matches.map((item, index) => (
              <li key={item.code} role="presentation">
                <button
                  type="button"
                  role="option"
                  id={`${listId}-${item.code}`}
                  aria-selected={index === active}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(item.code)}
                  className={`flex w-full items-baseline justify-between gap-3 px-4 py-2 text-left text-sm ${
                    index === active
                      ? "bg-clay/10 text-ink"
                      : "text-ink hover:bg-cream"
                  }`}
                >
                  <span>{item.name}</span>
                  <span className="text-xs tracking-wide text-mute">
                    {item.code}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

export function FindFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = filtersFromSearchParams(searchParams);
  const [customSpecialty, setCustomSpecialty] = useState("");

  function apply(next: SearchFilters) {
    router.push(buildFindHref(next), { scroll: false });
  }

  function addCustomSpecialty() {
    const label = normalizeSpecialtyFilterLabel(customSpecialty, [
      ...specialtyFilterChips(filters.tags),
      ...INSURANCE_PRESETS,
    ]);
    setCustomSpecialty("");
    if (!label || filters.tags.includes(label)) return;
    apply({ ...filters, tags: [...filters.tags, label] });
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
        {specialtyFilterChips(filters.tags).map((label) => (
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
        <form
          className="inline-flex max-w-full items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            addCustomSpecialty();
          }}
        >
          <label className="sr-only" htmlFor="custom-specialty">
            Add a specialty
          </label>
          <input
            id="custom-specialty"
            key={filters.tags.join("|")}
            value={customSpecialty}
            onChange={(event) => setCustomSpecialty(event.target.value)}
            placeholder="Add your own"
            maxLength={SEARCH_SPECIALTY_MAX_LENGTH}
            autoComplete="off"
            className="w-[9.5rem] min-w-0 rounded-full border border-line bg-paper px-3.5 py-1.5 text-sm text-ink placeholder:text-mute"
          />
          <button type="submit" className={chipClass(false)}>
            Add
          </button>
        </form>
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
        <StateLicensePicker
          state={filters.state}
          onSelect={(next) => apply({ ...filters, state: next })}
        />
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
