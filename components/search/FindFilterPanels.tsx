"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { cx, fieldClass, primaryPillClass } from "@/components/ui/styles";
import { showTherapistsLabel } from "@/lib/search/find-desktop";
import { FIND_TOPICS, isFindTopicSpecialty } from "@/lib/tags/plain-language";
import {
  SPECIALTY_PRESETS,
  filterLicenseStates,
} from "@/lib/tags/presets";
import { sentenceCasePhrase } from "@/lib/copy/sentence-case";

export function TopicPanel({
  tags,
  onToggle,
  matchCount,
}: {
  tags: string[];
  onToggle: (specialty: string) => void;
  matchCount: number | null;
}) {
  const extras = tags.filter(
    (tag) =>
      (SPECIALTY_PRESETS as readonly string[]).includes(tag) &&
      !isFindTopicSpecialty(tag),
  );

  return (
    <Card id="find-whats-going-on" className="mt-4 px-6 py-6 sm:px-8 sm:py-7">
      <h2 className="font-display text-[22px] leading-7 font-medium text-heading">
        What would you like help with?
      </h2>
      <p className="mt-1 max-w-3xl font-sans text-[15px] leading-6 text-meta">
        Pick anything that sounds like you. You don&apos;t need the clinical
        term; it&apos;s in small print in case you know it.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {FIND_TOPICS.map((topic) => (
          <TopicChip
            key={topic.specialty}
            plain={topic.plain}
            clinical={topic.clinical}
            selected={tags.includes(topic.specialty)}
            onClick={() => onToggle(topic.specialty)}
          />
        ))}
        {extras.map((label) => (
          <TopicChip
            key={label}
            plain={sentenceCasePhrase(label)}
            clinical={label}
            selected
            onClick={() => onToggle(label)}
          />
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="font-sans text-[14px] leading-5 text-meta">
          Pick as many as you like. You can change these anytime.
        </p>
        <a href="#find-results" className={`${primaryPillClass} px-6 py-3`}>
          {showTherapistsLabel(matchCount)}
        </a>
      </div>
    </Card>
  );
}

function TopicChip({
  plain,
  clinical,
  selected,
  onClick,
}: {
  plain: string;
  clinical: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cx(
        "max-w-full min-w-0 rounded-2xl px-3.5 py-2 text-left text-[15px] leading-snug",
        selected
          ? "bg-ink font-medium text-paper hover:bg-ink-dark"
          : "border border-line bg-paper font-normal text-ink hover:border-ink/30",
      )}
    >
      <span className="block font-medium">{plain}</span>
      <span
        className={cx(
          "mt-0.5 block text-[12px] leading-4 font-normal",
          selected ? "text-paper/80" : "text-meta",
        )}
      >
        {clinical}
      </span>
    </button>
  );
}

export function PlacePanel({
  state,
  onSelect,
}: {
  state: string | null;
  onSelect: (state: string | null) => void;
}) {
  const [query, setQuery] = useState("");
  const matches = filterLicenseStates(query);

  return (
    <div
      id="find-where-you-live"
      className="mt-3 max-w-md rounded-card bg-paper p-4 shadow-card"
    >
      <label className="sr-only" htmlFor="find-state-query">
        Where you live
      </label>
      <input
        id="find-state-query"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search state (California or CA)"
        autoComplete="off"
        className={fieldClass}
      />
      <ul className="mt-2 max-h-64 overflow-auto">
        {state ? (
          <li>
            <button
              type="button"
              onClick={() => onSelect(null)}
              className="w-full px-3 py-2 text-left text-sm text-ink hover:bg-cream"
            >
              Any state
            </button>
          </li>
        ) : null}
        {matches.length === 0 ? (
          <li className="px-3 py-2 text-sm text-mute">No matching state</li>
        ) : (
          matches.map((item) => (
            <li key={item.code}>
              <button
                type="button"
                onClick={() => onSelect(item.code)}
                className="flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left text-sm text-ink hover:bg-cream"
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
