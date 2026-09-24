"use client";

import type { Dispatch, SetStateAction } from "react";
import type { JoinDraft } from "@/lib/join/types";
import { CREDENTIALS, LICENSE_STATES } from "@/lib/tags/presets";

const fieldClass =
  "mt-2 w-full border-0 border-b border-line bg-transparent px-0 py-3 text-lg outline-none focus:border-clay";
const labelClass =
  "text-xs font-semibold tracking-[0.16em] text-mute uppercase";

export function JoinStep1({
  draft,
  setDraft,
}: {
  draft: JoinDraft;
  setDraft: Dispatch<SetStateAction<JoinDraft>>;
}) {
  return (
    <div className="space-y-8">
      <label className="block">
        <span className={labelClass}>Full name</span>
        <input
          required
          aria-required="true"
          autoComplete="name"
          value={draft.name}
          onChange={(event) =>
            setDraft((current) => ({ ...current, name: event.target.value }))
          }
          className={fieldClass}
        />
      </label>

      <div className="grid gap-8 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Credential</span>
          <select
            value={draft.credential}
            onChange={(event) => {
              const credential = event.target.value;
              setDraft((current) => ({
                ...current,
                credential,
              }));
            }}
            className={fieldClass}
          >
            <option value="">Choose a credential</option>
            {CREDENTIALS.map((credential) => (
              <option key={credential} value={credential}>
                {credential}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={labelClass}>Years practicing</span>
          <input
            type="number"
            min={0}
            max={70}
            step={1}
            value={draft.yearsPracticing}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                yearsPracticing:
                  event.target.value === "" ? "" : Number(event.target.value),
              }))
            }
            className={fieldClass}
          />
        </label>
      </div>

      <StringListField
        legend="Education (optional)"
        items={draft.education}
        placeholder="e.g. M.A. Counseling Psychology"
        addLabel="+ Add another degree"
        onChange={(education) =>
          setDraft((current) => ({ ...current, education }))
        }
      />

      <StringListField
        legend="Credentials & certificates (optional)"
        items={draft.credentials}
        placeholder="e.g. EMDR trained"
        addLabel="+ Add another credential"
        onChange={(credentials) =>
          setDraft((current) => ({ ...current, credentials }))
        }
      />

      <fieldset>
        <legend className={labelClass}>State license(s)</legend>
        <div className="mt-4 space-y-3">
          {draft.licenses.map((license, index) => {
            const rowRequired =
              index === 0 ||
              Boolean(license.number.trim() || license.state.trim());
            return (
              <div key={index} className="flex items-center gap-2">
                <label className="min-w-0 flex-1">
                  <span className="sr-only">License number</span>
                  <input
                    required={rowRequired}
                    aria-required={rowRequired}
                    aria-label={`License ${index + 1} number`}
                    placeholder="License # (e.g. MFC 112938)"
                    value={license.number}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        licenses: current.licenses.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, number: event.target.value }
                            : item,
                        ),
                      }))
                    }
                    className="w-full rounded-full border border-line bg-paper px-4 py-2.5 outline-none placeholder:text-mute/70 focus:border-clay"
                  />
                </label>
                <label className="w-[5.5rem] shrink-0">
                  <span className="sr-only">License state</span>
                  <select
                    required={rowRequired}
                    aria-required={rowRequired}
                    aria-label={`License ${index + 1} state`}
                    value={license.state}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        licenses: current.licenses.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, state: event.target.value }
                            : item,
                        ),
                      }))
                    }
                    className="w-full rounded-full border border-line bg-paper px-3 py-2.5 outline-none focus:border-clay"
                  >
                    <option value="">State</option>
                    {LICENSE_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  aria-label={`Remove license ${index + 1}`}
                  disabled={draft.licenses.length === 1}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      licenses: current.licenses.filter(
                        (_, itemIndex) => itemIndex !== index,
                      ),
                    }))
                  }
                  className="grid size-9 shrink-0 place-items-center rounded-full text-xl text-mute hover:bg-cream hover:text-clay disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() =>
            setDraft((current) => ({
              ...current,
              licenses: [...current.licenses, { number: "", state: "" }],
            }))
          }
          className="mt-3 w-full rounded-full border border-dashed border-clay/50 px-5 py-2.5 text-sm font-medium text-clay hover:bg-cream"
        >
          + Add another state license
        </button>
      </fieldset>
    </div>
  );
}

function StringListField({
  legend,
  items,
  placeholder,
  addLabel,
  onChange,
}: {
  legend: string;
  items: string[];
  placeholder: string;
  addLabel: string;
  onChange: (items: string[]) => void;
}) {
  const rows = items.length > 0 ? items : [""];

  return (
    <fieldset>
      <legend className={labelClass}>{legend}</legend>
      <div className="mt-4 space-y-3">
        {rows.map((value, index) => (
          <div key={index} className="flex items-center gap-2">
            <label className="min-w-0 flex-1">
              <span className="sr-only">
                {legend} {index + 1}
              </span>
              <input
                aria-label={`${legend} ${index + 1}`}
                placeholder={placeholder}
                value={value}
                onChange={(event) => {
                  const next = [...rows];
                  next[index] = event.target.value;
                  onChange(next);
                }}
                className="w-full rounded-full border border-line bg-paper px-4 py-2.5 outline-none placeholder:text-mute/70 focus:border-clay"
              />
            </label>
            <button
              type="button"
              aria-label={`Remove ${legend} ${index + 1}`}
              disabled={rows.length === 1}
              onClick={() =>
                onChange(rows.filter((_, itemIndex) => itemIndex !== index))
              }
              className="grid size-9 shrink-0 place-items-center rounded-full text-xl text-mute hover:bg-cream hover:text-clay disabled:cursor-not-allowed disabled:opacity-30"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...rows, ""])}
        className="mt-3 w-full rounded-full border border-dashed border-clay/50 px-5 py-2.5 text-sm font-medium text-clay hover:bg-cream"
      >
        {addLabel}
      </button>
    </fieldset>
  );
}
