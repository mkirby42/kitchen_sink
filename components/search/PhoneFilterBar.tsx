"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { buttonClass, cx, fieldClass, primaryPillClass } from "@/components/ui/styles";
import { buildFindHref, findViewFromSearchParams } from "@/components/search/query";
import {
  clearPhoneSheet,
  phonePills,
  type PhoneSheet,
} from "@/lib/search/phone-find";
import { showTherapistsLabel } from "@/lib/search/find-desktop";
import { FIND_TOPICS, isFindTopicSpecialty } from "@/lib/tags/plain-language";
import {
  INSURANCE_PRESETS,
  SPECIALTY_PRESETS,
  filterLicenseStates,
} from "@/lib/tags/presets";
import { sentenceCasePhrase } from "@/lib/copy/sentence-case";
import type { SearchFilters } from "@/lib/search/rpc";

function toggleTag(tags: string[], label: string) {
  return tags.includes(label)
    ? tags.filter((tag) => tag !== label)
    : [...tags, label];
}

export function PhoneFilterBar({
  filters,
  matchCount,
  open,
  onOpen,
}: {
  filters: SearchFilters;
  matchCount: number | null;
  open: PhoneSheet | null;
  onOpen: (sheet: PhoneSheet | null) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function apply(next: SearchFilters) {
    const view = findViewFromSearchParams(searchParams);
    router.push(buildFindHref(next, { layout: view.layout }), { scroll: false });
  }

  return (
    <>
      <div
        data-phone-pills=""
        className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]"
      >
        {phonePills(filters).map((pill) => (
          <button
            key={pill.id}
            type="button"
            data-phone-pill={pill.id}
            data-pressed={pill.pressed ? "true" : "false"}
            aria-expanded={open === pill.id}
            aria-controls="phone-filter-sheet"
            onClick={() => onOpen(open === pill.id ? null : pill.id)}
            className={cx(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-paper px-3.5 py-2 font-sans text-[15px] font-medium text-ink",
              pill.pressed ? "border-2 border-heading" : "border border-line",
            )}
          >
            {pill.label}
            <Chevron />
          </button>
        ))}
      </div>
      {open ? (
        <PhoneFilterSheet
          sheet={open}
          filters={filters}
          matchCount={matchCount}
          onApply={apply}
          onClose={() => onOpen(null)}
        />
      ) : null}
    </>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 12 8" className="h-2 w-3 shrink-0" aria-hidden>
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

export function PhoneFilterSheet({
  sheet,
  filters,
  matchCount,
  onApply,
  onClose,
}: {
  sheet: PhoneSheet;
  filters: SearchFilters;
  matchCount: number | null;
  onApply: (next: SearchFilters) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-end bg-ink/40"
      onClick={onClose}
    >
      <div
        id="phone-filter-sheet"
        role="dialog"
        aria-modal="true"
        data-phone-sheet={sheet}
        className="max-h-[85vh] w-full overflow-auto rounded-t-3xl bg-paper px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-overlay"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" aria-hidden />
        <SheetBody sheet={sheet} filters={filters} onApply={onApply} />
        <div className="sticky bottom-0 mt-6 flex gap-2 bg-paper pt-3">
          <button
            type="button"
            className={buttonClass("secondary", "min-w-0 flex-1")}
            onClick={() => onApply(clearPhoneSheet(filters, sheet))}
          >
            Clear all
          </button>
          <button
            type="button"
            className={`${primaryPillClass} min-w-0 flex-1 px-4 py-2.5`}
            onClick={onClose}
          >
            {showTherapistsLabel(matchCount)}
          </button>
        </div>
      </div>
    </div>
  );
}

function SheetBody({
  sheet,
  filters,
  onApply,
}: {
  sheet: PhoneSheet;
  filters: SearchFilters;
  onApply: (next: SearchFilters) => void;
}) {
  if (sheet === "topics") return <TopicSheet filters={filters} onApply={onApply} />;
  if (sheet === "place") return <PlaceSheet filters={filters} onApply={onApply} />;
  if (sheet === "insurance") {
    return (
      <OptionList title="Insurance">
        {INSURANCE_PRESETS.map((label) => (
          <OptionRow
            key={label}
            title={sentenceCasePhrase(label)}
            selected={filters.tags.includes(label)}
            onClick={() =>
              onApply({ ...filters, tags: toggleTag(filters.tags, label) })
            }
          />
        ))}
      </OptionList>
    );
  }
  return (
    <OptionList title="In person or online">
      <OptionRow
        title="In person"
        selected={filters.inPerson}
        onClick={() => onApply({ ...filters, inPerson: !filters.inPerson })}
      />
      <OptionRow
        title="Online"
        selected={filters.virtual}
        onClick={() => onApply({ ...filters, virtual: !filters.virtual })}
      />
    </OptionList>
  );
}

function TopicSheet({
  filters,
  onApply,
}: {
  filters: SearchFilters;
  onApply: (next: SearchFilters) => void;
}) {
  const extras = filters.tags.filter(
    (tag) =>
      (SPECIALTY_PRESETS as readonly string[]).includes(tag) &&
      !isFindTopicSpecialty(tag),
  );
  return (
    <div>
      <h2 className="font-display text-[22px] leading-7 font-medium text-heading">
        What would you like help with?
      </h2>
      <p className="mt-1 font-sans text-[15px] leading-6 text-meta">
        Pick anything that sounds like you. You don&apos;t need the clinical
        term; it&apos;s in small print in case you know it.
      </p>
      <div className="mt-4 space-y-2">
        {FIND_TOPICS.map((topic) => (
          <OptionRow
            key={topic.specialty}
            title={topic.plain}
            detail={topic.clinical}
            selected={filters.tags.includes(topic.specialty)}
            onClick={() =>
              onApply({
                ...filters,
                tags: toggleTag(filters.tags, topic.specialty),
              })
            }
          />
        ))}
        {extras.map((label) => (
          <OptionRow
            key={label}
            title={sentenceCasePhrase(label)}
            detail={label}
            selected
            onClick={() =>
              onApply({ ...filters, tags: toggleTag(filters.tags, label) })
            }
          />
        ))}
      </div>
    </div>
  );
}

function PlaceSheet({
  filters,
  onApply,
}: {
  filters: SearchFilters;
  onApply: (next: SearchFilters) => void;
}) {
  const [query, setQuery] = useState("");
  const matches = filterLicenseStates(query);
  return (
    <div>
      <h2 className="font-display text-[22px] leading-7 font-medium text-heading">
        Where you live
      </h2>
      <label className="sr-only" htmlFor="phone-state-query">
        Where you live
      </label>
      <input
        id="phone-state-query"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search state (California or CA)"
        autoComplete="off"
        className={`${fieldClass} mt-4`}
      />
      <ul className="mt-2 max-h-64 overflow-auto">
        {filters.state ? (
          <li>
            <button
              type="button"
              onClick={() => onApply({ ...filters, state: null })}
              className="w-full px-1 py-2 text-left text-sm text-ink"
            >
              Any state
            </button>
          </li>
        ) : null}
        {matches.length === 0 ? (
          <li className="px-1 py-2 text-sm text-mute">No matching state</li>
        ) : (
          matches.map((item) => (
            <li key={item.code}>
              <button
                type="button"
                onClick={() => onApply({ ...filters, state: item.code })}
                className="flex w-full items-baseline justify-between gap-3 px-1 py-2 text-left text-sm text-ink"
              >
                <span>{item.name}</span>
                <span className="text-xs text-mute">{item.code}</span>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function OptionList({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h2 className="font-display text-[22px] leading-7 font-medium text-heading">
        {title}
      </h2>
      <div className="mt-4 space-y-2">{children}</div>
    </div>
  );
}

function OptionRow({
  title,
  detail,
  selected,
  onClick,
}: {
  title: string;
  detail?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cx(
        "flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left",
        selected ? "border-heading bg-lavender" : "border-line bg-paper",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block font-sans text-[15px] leading-5 font-medium text-ink">
          {title}
        </span>
        {detail ? (
          <span className="mt-0.5 block font-sans text-[12px] leading-4 text-meta">
            {detail}
          </span>
        ) : null}
      </span>
      <span
        aria-hidden
        className={cx(
          "size-5 shrink-0 rounded-full border",
          selected ? "border-heading bg-heading" : "border-line bg-paper",
        )}
      />
    </button>
  );
}
