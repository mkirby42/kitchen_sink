"use client";

import { useState, type ReactNode } from "react";
import { PhoneFilterBar } from "@/components/search/PhoneFilterBar";
import { PhoneProfileStack } from "@/components/search/PhoneProfileStack";
import { TherapistCardPhone } from "@/components/search/TherapistCardPhone";
import { Card } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { pageTitleClass } from "@/components/ui/styles";
import {
  therapistsFitLabel,
  type PhoneSheet,
  type StackCard,
} from "@/lib/search/phone-find";
import { phoneBrowseKey } from "@/lib/search/phone-browse";
import type { PhoneStackBooking } from "@/lib/search/phone-stack";
import type { SearchFilters, SearchRow } from "@/lib/search/rpc";

const emptyFilters: SearchFilters = {
  tags: [],
  virtual: false,
  inPerson: false,
  state: null,
};

export function PhoneFind({
  rows,
  booking,
  slides,
  listCards,
  filters = emptyFilters,
  layout = "grid",
  initialMode = "list",
}: {
  rows: SearchRow[] | null;
  booking: PhoneStackBooking[];
  /** Phone profile columns, one per row, same order. */
  slides: ReactNode;
  /** Conversation cards per row, same order. The list portrait prefers who-I-work-best-with. */
  listCards?: readonly (readonly StackCard[] | undefined)[];
  filters?: SearchFilters;
  layout?: "grid" | "one";
  /** `layout=one` on the address opens one-at-a-time without a script. */
  initialMode?: "list" | "one";
}) {
  const [mode, setMode] = useState<"list" | "one">(initialMode);
  const [sheet, setSheet] = useState<PhoneSheet | null>(null);
  const count = rows?.length ?? 0;
  const stack = mode === "one" && rows != null && count > 0;

  return (
    <div data-phone-find="" data-phone-mode={stack ? "one" : "list"}>
      {stack ? (
        <PhoneProfileStack
          key={phoneBrowseKey(
            filters,
            rows.map((row) => row.profile_id),
          )}
          rows={rows}
          booking={booking}
          onBack={() => setMode("list")}
        >
          {slides}
        </PhoneProfileStack>
      ) : (
        <>
          <h1 className={`text-center ${pageTitleClass}`}>Find your therapist</h1>
          <div className="mt-6">
            <PhoneFilterBar
              filters={filters}
              layout={layout}
              matchCount={rows?.length ?? null}
              open={sheet}
              onOpen={setSheet}
            />
          </div>
          {rows === null ? null : (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="font-sans text-[15px] font-medium text-ink">
                {therapistsFitLabel(count)}
              </p>
              {count > 0 ? (
                <SegmentedControl
                  label="How to browse therapists"
                  size="sm"
                  value={mode}
                  onChange={(next) => {
                    setSheet(null);
                    setMode(next);
                  }}
                  options={[
                    { value: "list", label: "List" },
                    { value: "one", label: "One at a time" },
                  ]}
                />
              ) : null}
            </div>
          )}
          {rows === null ? (
            <Card as="div" className="mt-4 px-6 py-10 text-center text-mute">
              <p>Therapist search isn&apos;t available right now.</p>
            </Card>
          ) : count === 0 ? (
            <Card as="div" className="mt-4 px-6 py-10 text-center text-mute">
              <p>No therapists match</p>
            </Card>
          ) : (
            <ul data-phone-list="" className="mt-4 space-y-3">
              {rows.map((row, index) => (
                <li key={row.profile_id}>
                  <Card className="overflow-hidden p-0">
                    <TherapistCardPhone
                      row={row}
                      filters={filters}
                      cards={listCards?.[index]}
                    />
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
