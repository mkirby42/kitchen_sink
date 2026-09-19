"use client";

import type { Dispatch, SetStateAction } from "react";
import type { JoinDraft } from "@/lib/join/types";
import { needsSupervisor } from "@/lib/therapists/credential";
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
  const requiresSupervisor = needsSupervisor(draft.credential);

  return (
    <div className="space-y-8">
      <label className="block">
        <span className={labelClass}>Full name</span>
        <input
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
                ...(!needsSupervisor(credential)
                  ? { supervisorName: "", supervisorLicense: "" }
                  : {}),
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

      {requiresSupervisor ? (
        <div className="space-y-6">
          <div className="rounded-2xl bg-cream px-5 py-4 text-sm leading-6 text-mute">
            Since you&apos;re practicing under supervision, we&apos;ll note your
            supervisor&apos;s name and license alongside your profile, as most
            states require.
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Supervisor name *</span>
              <input
                value={draft.supervisorName}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    supervisorName: event.target.value,
                  }))
                }
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className={labelClass}>Supervisor license # *</span>
              <input
                value={draft.supervisorLicense}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    supervisorLicense: event.target.value,
                  }))
                }
                className={fieldClass}
              />
            </label>
          </div>
          {!draft.supervisorName.trim() || !draft.supervisorLicense.trim() ? (
            <p className="text-sm font-medium text-clay-dark">
              Associate and trainee credentials require both supervisor fields.
            </p>
          ) : null}
        </div>
      ) : null}

      <fieldset>
        <legend className={labelClass}>State license(s)</legend>
        <div className="mt-4 space-y-4">
          {draft.licenses.map((license, index) => (
            <div
              key={index}
              className="grid gap-4 rounded-2xl bg-cream p-4 sm:grid-cols-[1fr_8rem_auto]"
            >
              <label>
                <span className="sr-only">License number</span>
                <input
                  aria-label={`License ${index + 1} number`}
                  placeholder="License #"
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
                  className="w-full border-b border-line bg-transparent py-2 outline-none focus:border-clay"
                />
              </label>
              <label>
                <span className="sr-only">License state</span>
                <select
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
                  className="w-full border-b border-line bg-transparent py-2 outline-none focus:border-clay"
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
                className="size-9 rounded-full text-xl text-mute hover:bg-paper hover:text-clay disabled:cursor-not-allowed disabled:opacity-30"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setDraft((current) => ({
              ...current,
              licenses: [...current.licenses, { number: "", state: "" }],
            }))
          }
          className="mt-4 w-full rounded-2xl border border-dashed border-clay/50 px-5 py-3 text-sm font-semibold text-clay hover:bg-cream"
        >
          + Add another state license
        </button>
      </fieldset>
    </div>
  );
}
