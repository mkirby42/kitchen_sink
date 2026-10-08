"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { Switch } from "@/components/ui/Switch";
import { TextField, SelectField } from "@/components/ui/Field";
import { eyebrowClass, fieldClass } from "@/components/ui/styles";
import { normalizeCustomLabel } from "@/lib/join/cards";
import type { JoinDraft } from "@/lib/join/types";
import {
  IDENTITY_PRESETS,
  INSURANCE_PRESETS,
  LICENSE_STATES,
  MODALITY_PRESETS,
  SPECIALTY_PRESETS,
} from "@/lib/tags/presets";

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
      <legend className={eyebrowClass}>{title}</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {labels.map((label) => (
          <Tag
            key={label}
            selected={selected.includes(label)}
            onClick={() => toggle(label)}
          >
            {label}
          </Tag>
        ))}
        {selected
          .filter((label) => !labels.includes(label))
          .map((label) => (
            <Tag key={label} selected onClick={() => toggle(label)}>
              {label} ×
            </Tag>
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
            className={fieldClass}
          />
          <Button type="button" variant="secondary" onClick={addCustom}>
            Add
          </Button>
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
      <div className="flex items-center justify-between gap-4 rounded-box bg-cream px-5 py-4">
        <div>
          <p className="font-semibold">Currently accepting new clients</p>
          <p className="mt-1 text-sm text-mute">You can update this later.</p>
        </div>
        <Switch
          label="Currently accepting new clients"
          checked={draft.openToNewClients}
          onChange={(openToNewClients) =>
            setDraft((current) => ({ ...current, openToNewClients }))
          }
        />
      </div>

      <fieldset>
        <legend className={eyebrowClass}>Session format</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          <Tag
            selected={draft.virtual}
            onClick={() =>
              setDraft((current) => ({ ...current, virtual: !current.virtual }))
            }
          >
            Virtual
          </Tag>
          <Tag
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
          </Tag>
        </div>
      </fieldset>

      {draft.inPerson && draft.location ? (
        <div className="rounded-box bg-cream p-5">
          <p className={eyebrowClass}>Practice location</p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextField
                label="Street address"
                value={draft.location.address}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    location: current.location
                      ? { ...current.location, address: event.target.value }
                      : null,
                  }))
                }
              />
            </div>
            <SelectField
              label="State"
              value={draft.location.state}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  location: current.location
                    ? { ...current.location, state: event.target.value }
                    : null,
                }))
              }
            >
              <option value="">Choose state</option>
              {LICENSE_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </SelectField>
            <TextField
              label="ZIP"
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
            />
          </div>
        </div>
      ) : null}

      <TagGroup
        title="Areas of Interest"
        labels={SPECIALTY_PRESETS}
        field="specialties"
        selected={draft.specialties}
        setDraft={setDraft}
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
