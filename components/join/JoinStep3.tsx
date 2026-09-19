"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { normalizeCustomLabel } from "@/lib/join/cards";
import type { JoinDraft } from "@/lib/join/types";
import {
  IDENTITY_PRESETS,
  INSURANCE_PRESETS,
  LICENSE_STATES,
  MODALITY_PRESETS,
  SPECIALTY_PRESETS,
} from "@/lib/tags/presets";
import { Chip } from "./Chip";

type TagField = "specialties" | "modalities" | "insurance" | "identity";

function TagGroup({
  title,
  labels,
  field,
  selected,
  setDraft,
  custom = false,
}: {
  title: string;
  labels: readonly string[];
  field: TagField;
  selected: string[];
  setDraft: Dispatch<SetStateAction<JoinDraft>>;
  custom?: boolean;
}) {
  const [customLabel, setCustomLabel] = useState("");

  function toggle(label: string) {
    setDraft((current) => ({
      ...current,
      [field]: current[field].includes(label)
        ? current[field].filter((item) => item !== label)
        : [...current[field], label],
    }));
  }

  function addCustom() {
    const label = normalizeCustomLabel(customLabel);
    if (!label) return;
    setDraft((current) => ({
      ...current,
      [field]: current[field].some(
        (item) => item.toLowerCase() === label.toLowerCase(),
      )
        ? current[field]
        : [...current[field], label],
    }));
    setCustomLabel("");
  }

  return (
    <fieldset>
      <legend className="text-xs font-semibold tracking-[0.16em] text-mute uppercase">
        {title}
      </legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {labels.map((label) => (
          <Chip
            key={label}
            selected={selected.includes(label)}
            onClick={() => toggle(label)}
          >
            {label}
          </Chip>
        ))}
        {selected
          .filter((label) => !labels.includes(label))
          .map((label) => (
            <Chip key={label} selected onClick={() => toggle(label)}>
              {label} ×
            </Chip>
          ))}
      </div>
      {custom ? (
        <div className="mt-3 flex gap-2">
          <input
            value={customLabel}
            onChange={(event) => setCustomLabel(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCustom();
              }
            }}
            placeholder="Add your own"
            className="min-w-0 flex-1 rounded-full border border-line bg-paper px-4 py-2 text-sm outline-none focus:border-clay"
          />
          <button
            type="button"
            onClick={addCustom}
            className="rounded-full border border-clay px-4 py-2 text-sm font-semibold text-clay hover:bg-cream"
          >
            Add
          </button>
        </div>
      ) : null}
    </fieldset>
  );
}

export function JoinStep3({
  draft,
  setDraft,
}: {
  draft: JoinDraft;
  setDraft: Dispatch<SetStateAction<JoinDraft>>;
}) {
  return (
    <div className="space-y-9">
      <div className="flex items-center justify-between gap-4 rounded-2xl bg-cream px-5 py-4">
        <div>
          <p className="font-semibold">Currently accepting new clients</p>
          <p className="mt-1 text-sm text-mute">You can update this later.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={draft.openToNewClients}
          onClick={() =>
            setDraft((current) => ({
              ...current,
              openToNewClients: !current.openToNewClients,
            }))
          }
          className={`relative h-7 w-12 rounded-full transition ${
            draft.openToNewClients ? "bg-clay" : "bg-line"
          }`}
        >
          <span
            className={`absolute top-1 size-5 rounded-full bg-paper shadow transition ${
              draft.openToNewClients ? "left-6" : "left-1"
            }`}
          />
        </button>
      </div>

      <fieldset>
        <legend className="text-xs font-semibold tracking-[0.16em] text-mute uppercase">
          Session format
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip
            selected={draft.virtual}
            onClick={() =>
              setDraft((current) => ({ ...current, virtual: !current.virtual }))
            }
          >
            Virtual
          </Chip>
          <Chip
            selected={draft.inPerson}
            onClick={() =>
              setDraft((current) => {
                const inPerson = !current.inPerson;
                return {
                  ...current,
                  inPerson,
                  location: inPerson
                    ? current.location ?? {
                        address: "",
                        state: "",
                        zip: "",
                      }
                    : null,
                };
              })
            }
          >
            In-Person
          </Chip>
        </div>
      </fieldset>

      {draft.inPerson && draft.location ? (
        <div className="rounded-2xl bg-cream p-5">
          <p className="text-xs font-semibold tracking-[0.16em] text-mute uppercase">
            Practice location
          </p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="text-sm text-mute">Street address</span>
              <input
                value={draft.location.address}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    location: current.location
                      ? { ...current.location, address: event.target.value }
                      : null,
                  }))
                }
                className="mt-1 w-full border-b border-line bg-transparent py-2 outline-none focus:border-clay"
              />
            </label>
            <label>
              <span className="text-sm text-mute">State</span>
              <select
                value={draft.location.state}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    location: current.location
                      ? { ...current.location, state: event.target.value }
                      : null,
                  }))
                }
                className="mt-1 w-full border-b border-line bg-transparent py-2 outline-none focus:border-clay"
              >
                <option value="">Choose state</option>
                {LICENSE_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-sm text-mute">ZIP</span>
              <input
                inputMode="numeric"
                value={draft.location.zip}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    location: current.location
                      ? { ...current.location, zip: event.target.value }
                      : null,
                  }))
                }
                className="mt-1 w-full border-b border-line bg-transparent py-2 outline-none focus:border-clay"
              />
            </label>
          </div>
        </div>
      ) : null}

      <TagGroup
        title="Specialties"
        labels={SPECIALTY_PRESETS}
        field="specialties"
        selected={draft.specialties}
        setDraft={setDraft}
        custom
      />
      <TagGroup
        title="Modalities / approach"
        labels={MODALITY_PRESETS}
        field="modalities"
        selected={draft.modalities}
        setDraft={setDraft}
        custom
      />
      <TagGroup
        title="Insurance"
        labels={INSURANCE_PRESETS}
        field="insurance"
        selected={draft.insurance}
        setDraft={setDraft}
        custom
      />
      <TagGroup
        title="Identity (optional)"
        labels={IDENTITY_PRESETS}
        field="identity"
        selected={draft.identity}
        setDraft={setDraft}
      />
    </div>
  );
}
