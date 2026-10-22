"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tag } from "@/components/ui/Tag";
import { cx } from "@/components/ui/styles";
import type { SearchFilters } from "@/lib/search/rpc";
import { isFindTopicSpecialty } from "@/lib/tags/plain-language";
import { INSURANCE_PRESETS, licenseStateLabel } from "@/lib/tags/presets";
import { sentenceCasePhrase } from "@/lib/copy/sentence-case";
import { PlacePanel, TopicPanel } from "./FindFilterPanels";
import {
  buildFindHref,
  filtersFromSearchParams,
  findViewFromSearchParams,
} from "./query";

type Menu = "topics" | "place" | "insurance" | "format" | null;

function toggleTag(tags: string[], label: string) {
  return tags.includes(label)
    ? tags.filter((tag) => tag !== label)
    : [...tags, label];
}

export function FindDesktopFilters({
  matchCount,
  leading,
  initialOpen = "topics",
}: {
  matchCount: number | null;
  /** Desktop page title, so the pills can sit on the same row. */
  leading?: ReactNode;
  /** Closed on the clicked-in profile so that page leads with the therapist. */
  initialOpen?: Menu;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = filtersFromSearchParams(searchParams);
  const [open, setOpen] = useState<Menu>(initialOpen);

  useEffect(() => {
    if (initialOpen === null) setOpen(null);
  }, [initialOpen]);

  function apply(next: SearchFilters) {
    const view = findViewFromSearchParams(searchParams);
    router.push(buildFindHref(next, { layout: view.layout }), { scroll: false });
  }

  function toggleMenu(menu: Exclude<Menu, null>) {
    setOpen((current) => (current === menu ? null : menu));
  }

  const insuranceOn = filters.tags.some((tag) =>
    (INSURANCE_PRESETS as readonly string[]).includes(tag),
  );
  const placeLabel = filters.state
    ? `Where you live · ${licenseStateLabel(filters.state)}`
    : "Where you live";

  return (
    <div className={leading ? undefined : "mt-8"} data-find-desktop="filters">
      <div
        className={
          leading
            ? "flex flex-wrap items-center justify-between gap-x-6 gap-y-3"
            : "flex flex-wrap gap-2"
        }
      >
        {leading}
        <div
          className={
            leading ? "flex min-w-0 flex-1 flex-wrap justify-center gap-2" : "contents"
          }
        >
        <FilterPill
          label={placeLabel}
          open={open === "place"}
          pressed={Boolean(filters.state)}
          controls="find-where-you-live"
          onClick={() => toggleMenu("place")}
        />
        <FilterPill
          label="Insurance"
          open={open === "insurance"}
          pressed={insuranceOn}
          controls="find-insurance"
          onClick={() => toggleMenu("insurance")}
        />
        <FilterPill
          label="What's going on"
          open={open === "topics"}
          pressed={filters.tags.some((tag) => isFindTopicSpecialty(tag))}
          controls="find-whats-going-on"
          onClick={() => toggleMenu("topics")}
        />
        <FilterPill
          label="In person or online"
          open={open === "format"}
          pressed={filters.virtual || filters.inPerson}
          controls="find-format"
          onClick={() => toggleMenu("format")}
        />
        </div>
      </div>

      {open === "topics" ? (
        <TopicPanel
          tags={filters.tags}
          onToggle={(specialty) =>
            apply({ ...filters, tags: toggleTag(filters.tags, specialty) })
          }
          matchCount={matchCount}
        />
      ) : null}
      {open === "place" ? (
        <PlacePanel
          state={filters.state}
          onSelect={(state) => apply({ ...filters, state })}
        />
      ) : null}
      {open === "insurance" ? (
        <div
          id="find-insurance"
          className="mt-3 flex max-w-xl flex-wrap gap-2 rounded-card bg-paper p-4 shadow-card"
        >
          {INSURANCE_PRESETS.map((label) => (
            <Tag
              key={label}
              selected={filters.tags.includes(label)}
              onClick={() =>
                apply({ ...filters, tags: toggleTag(filters.tags, label) })
              }
            >
              {sentenceCasePhrase(label)}
            </Tag>
          ))}
        </div>
      ) : null}
      {open === "format" ? (
        <div
          id="find-format"
          className="mt-3 flex flex-wrap gap-2 rounded-card bg-paper p-4 shadow-card"
        >
          <Tag
            selected={filters.inPerson}
            onClick={() => apply({ ...filters, inPerson: !filters.inPerson })}
          >
            In person
          </Tag>
          <Tag
            selected={filters.virtual}
            onClick={() => apply({ ...filters, virtual: !filters.virtual })}
          >
            Online
          </Tag>
        </div>
      ) : null}
    </div>
  );
}

function FilterPill({
  label,
  open,
  pressed,
  controls,
  onClick,
}: {
  label: string;
  open: boolean;
  pressed: boolean;
  controls: string;
  onClick: () => void;
}) {
  const on = open || pressed;
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={controls}
      onClick={onClick}
      className={cx(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 font-sans text-[15px] font-medium",
        on
          ? "border-transparent bg-lavender text-ink"
          : "border-line bg-paper text-ink hover:border-ink/30",
      )}
    >
      {label}
      <Chevron up={open} />
    </button>
  );
}

function Chevron({ up }: { up: boolean }) {
  return (
    <svg
      viewBox="0 0 12 8"
      className={cx("h-2 w-3 shrink-0", up && "rotate-180")}
      aria-hidden
    >
      <path
        d="M1 1.5 6 6.5 11 1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

