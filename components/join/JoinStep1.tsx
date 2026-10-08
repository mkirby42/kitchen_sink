"use client";

import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { eyebrowClass, fieldClass, selectClass } from "@/components/ui/styles";
import type { JoinDraft } from "@/lib/join/types";
import { CREDENTIALS, LICENSE_STATES } from "@/lib/tags/presets";

export function JoinStep1({
  draft,
  setDraft,
}: {
  draft: JoinDraft;
  setDraft: Dispatch<SetStateAction<JoinDraft>>;
}) {
  return (
    <div className="space-y-8">
      <TextField
        label="Full name"
        required
        aria-required="true"
        autoComplete="name"
        value={draft.name}
        onChange={(event) =>
          setDraft((current) => ({ ...current, name: event.target.value }))
        }
      />

      <div className="grid gap-8 sm:grid-cols-2">
        <SelectField
          label="Credential"
          value={draft.credential}
          onChange={(event) => {
            const credential = event.target.value;
            setDraft((current) => ({
              ...current,
              credential,
            }));
          }}
        >
          <option value="">Choose a credential</option>
          {CREDENTIALS.map((credential) => (
            <option key={credential} value={credential}>
              {credential}
            </option>
          ))}
        </SelectField>

        <TextField
          label="Years practicing"
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
        />
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
        <legend className={eyebrowClass}>State license(s)</legend>
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
                    className={fieldClass}
                  />
                </label>
                <label className="w-[7.5rem] shrink-0">
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
                    className={selectClass}
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
        <Button
          type="button"
          variant="secondary"
          className="mt-3 w-full"
          onClick={() =>
            setDraft((current) => ({
              ...current,
              licenses: [...current.licenses, { number: "", state: "" }],
            }))
          }
        >
          + Add another state license
        </Button>
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
      <legend className={eyebrowClass}>{legend}</legend>
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
                className={fieldClass}
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
      <Button
        type="button"
        variant="secondary"
        className="mt-3 w-full"
        onClick={() => onChange([...rows, ""])}
      >
        {addLabel}
      </Button>
    </fieldset>
  );
}
