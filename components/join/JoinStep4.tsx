"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { CONVERSATION_PROMPTS } from "@/lib/join/cards";
import type { JoinDraft } from "@/lib/join/types";
import {
  OUTREACH_OPTIONS,
  RATE_DURATIONS,
  RATE_SERVICE_TYPES,
} from "@/lib/tags/presets";
import { Chip } from "./Chip";

const FILTERS = [
  ["all", "All"],
  ["approach", "Approach"],
  ["session_vibe", "Session vibe"],
  ["specialty", "Specialties"],
  ["about", "About me"],
  ["outcome", "Outcome"],
] as const;

const labelClass =
  "text-xs font-semibold tracking-[0.16em] text-mute uppercase";
const underlineClass =
  "mt-2 w-full border-0 border-b border-line bg-transparent px-0 py-3 text-lg outline-none focus:border-clay";

export function JoinStep4({
  draft,
  setDraft,
}: {
  draft: JoinDraft;
  setDraft: Dispatch<SetStateAction<JoinDraft>>;
}) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("all");
  const [showCustom, setShowCustom] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  const usedServices = new Set(draft.rates.map((rate) => rate.service_type));
  const availableService = RATE_SERVICE_TYPES.find(
    (service) => !usedServices.has(service),
  );
  const filteredPrompts = CONVERSATION_PROMPTS.filter(
    (item) => filter === "all" || item.tag === filter,
  );
  const answeredCount = draft.cards.filter((card) => card.answer.trim()).length;

  function addPrompt(prompt: string, tag: string) {
    setDraft((current) => {
      if (current.cards.some((card) => card.prompt === prompt)) return current;
      return {
        ...current,
        cards: [...current.cards, { prompt, tag, answer: "" }],
      };
    });
  }

  function addCustomCard() {
    const prompt = customPrompt.trim();
    if (!prompt) return;
    setDraft((current) => {
      if (current.cards.some((card) => card.prompt === prompt)) return current;
      return {
        ...current,
        cards: [...current.cards, { prompt, answer: "", tag: "custom" }],
      };
    });
    setCustomPrompt("");
    setShowCustom(false);
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-mute">{answeredCount} of 3 added</p>

      {draft.cards.length ? (
        <div className="space-y-3">
          {draft.cards.map((card, index) => (
            <div
              key={`${card.prompt}-${index}`}
              className="flex gap-3 rounded-2xl border border-line px-4 py-4"
            >
              <span
                className="grid size-8 shrink-0 place-items-center rounded-full bg-clay text-sm text-paper"
                aria-hidden
              >
                ✦
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display italic text-clay">{card.prompt}</p>
                <textarea
                  rows={2}
                  value={card.answer}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      cards: current.cards.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, answer: event.target.value }
                          : item,
                      ),
                    }))
                  }
                  placeholder="Write 1–2 sentences in your own voice…"
                  className="mt-2 w-full resize-y bg-transparent text-sm leading-6 outline-none placeholder:text-mute/80"
                />
              </div>
              <button
                type="button"
                aria-label={`Remove ${card.prompt}`}
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    cards: current.cards.filter(
                      (_, itemIndex) => itemIndex !== index,
                    ),
                  }))
                }
                className="grid size-8 shrink-0 place-items-center rounded-full text-xl text-mute hover:bg-cream hover:text-clay"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(([value, label]) => {
          const selected = filter === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              onClick={() => setFilter(value)}
              className={
                selected
                  ? "rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper"
                  : "rounded-full bg-cream px-4 py-2 text-sm font-medium text-ink hover:bg-line"
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        {filteredPrompts.map((item) => {
          const added = draft.cards.some((card) => card.prompt === item.prompt);
          return (
            <button
              key={item.prompt}
              type="button"
              disabled={added}
              onClick={() => addPrompt(item.prompt, item.tag)}
              className="flex w-full items-center justify-between gap-4 rounded-2xl border border-line px-5 py-3 text-left disabled:opacity-50"
            >
              <span className="font-display italic text-clay">{item.prompt}</span>
              <span
                className="grid size-8 shrink-0 place-items-center rounded-full bg-cream text-lg text-clay"
                aria-hidden
              >
                +
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setShowCustom(true)}
        className="w-full rounded-full border border-dashed border-clay/60 px-5 py-3 text-sm font-medium text-clay hover:bg-cream"
      >
        ✎ Write your own prompt
      </button>
      {showCustom ? (
        <div className="space-y-4 rounded-2xl border border-line px-5 py-5">
          <label className="block">
            <span className={labelClass}>Your question</span>
            <input
              value={customPrompt}
              onChange={(event) => setCustomPrompt(event.target.value)}
              placeholder="e.g. what surprises new clients about me…"
              className={underlineClass}
            />
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={addCustomCard}
              className="rounded-full bg-clay px-5 py-2 text-sm font-semibold text-paper"
            >
              Add card
            </button>
            <button
              type="button"
              onClick={() => setShowCustom(false)}
              className="rounded-full border border-line bg-paper px-5 py-2 text-sm font-semibold text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <fieldset>
        <legend className={labelClass}>Rates</legend>
        <div className="mt-4 space-y-3">
          {draft.rates.map((rate, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="grid flex-1 grid-cols-[minmax(10.5rem,1.4fr)_6.75rem_5.75rem] items-center gap-3 rounded-full border border-line bg-paper px-4 py-1.5">
                <label className="min-w-[10.5rem]">
                  <span className="sr-only">Service type</span>
                  <select
                    aria-label={`Rate ${index + 1} service type`}
                    value={rate.service_type}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        rates: current.rates.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, service_type: event.target.value }
                            : item,
                        ),
                      }))
                    }
                    className="w-full min-w-[10.5rem] bg-transparent py-1.5 outline-none"
                  >
                    {RATE_SERVICE_TYPES.map((service) => (
                      <option
                        key={service}
                        value={service}
                        disabled={
                          service !== rate.service_type &&
                          usedServices.has(service)
                        }
                      >
                        {service}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="min-w-0">
                  <span className="sr-only">Duration</span>
                  <select
                    aria-label={`Rate ${index + 1} duration`}
                    value={rate.duration_minutes}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        rates: current.rates.map((item, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...item,
                                duration_minutes: Number(event.target.value),
                              }
                            : item,
                        ),
                      }))
                    }
                    className="w-full bg-transparent py-1.5 outline-none"
                  >
                    {RATE_DURATIONS.map((duration) => (
                      <option key={duration} value={duration}>
                        {duration} min
                      </option>
                    ))}
                  </select>
                </label>
                <label className="relative min-w-0">
                  <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-mute">
                    $
                  </span>
                  <span className="sr-only">Price in dollars</span>
                  <input
                    aria-label={`Rate ${index + 1} price in dollars`}
                    type="number"
                    min={0}
                    step="0.01"
                    value={rate.price_cents / 100}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        rates: current.rates.map((item, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...item,
                                price_cents: Math.round(
                                  Number(event.target.value || 0) * 100,
                                ),
                              }
                            : item,
                        ),
                      }))
                    }
                    className="w-full bg-transparent py-1.5 pl-4 outline-none"
                  />
                </label>
              </div>
              <button
                type="button"
                aria-label={`Remove rate ${index + 1}`}
                disabled={draft.rates.length === 1}
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    rates: current.rates.filter(
                      (_, itemIndex) => itemIndex !== index,
                    ),
                  }))
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
          disabled={!availableService}
          onClick={() => {
            if (!availableService) return;
            setDraft((current) => ({
              ...current,
              rates: [
                ...current.rates,
                {
                  service_type: availableService,
                  duration_minutes: 50,
                  price_cents: 0,
                },
              ],
            }));
          }}
          className="mt-3 w-full rounded-full border border-dashed border-clay/50 px-5 py-2.5 text-sm font-medium text-clay hover:bg-cream disabled:cursor-not-allowed disabled:opacity-40"
        >
          + Add another rate
        </button>
      </fieldset>

      <label className="block">
        <span className={labelClass}>About you</span>
        <textarea
          rows={5}
          value={draft.about}
          onChange={(event) =>
            setDraft((current) => ({ ...current, about: event.target.value }))
          }
          className="mt-3 w-full rounded-2xl border border-line bg-paper px-4 py-3 outline-none placeholder:text-mute/80 focus:border-clay"
          placeholder='Write this in the first person — e.g. "I work with adults navigating anxiety and big life transitions…" (shown at the top of your profile).'
        />
      </label>

      <section className="space-y-6">
        <fieldset>
          <legend className={labelClass}>How should clients reach you?</legend>
          <p className="mt-1 text-sm text-mute">
            Select all that apply — shown on your public profile so clients can
            contact you directly. Kitchen Sink doesn&apos;t handle introductions.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {OUTREACH_OPTIONS.map((option) => (
              <Chip
                key={option}
                selected={draft.outreach.includes(option)}
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    outreach: current.outreach.includes(option)
                      ? current.outreach.filter((item) => item !== option)
                      : [...current.outreach, option],
                  }))
                }
              >
                {option[0].toUpperCase() + option.slice(1)}
              </Chip>
            ))}
          </div>
        </fieldset>

        {draft.outreach.includes("email") ? (
          <label className="block">
            <span className={labelClass}>Email</span>
            <input
              type="text"
              autoComplete="email"
              value={draft.email}
              onChange={(event) =>
                setDraft((current) => ({ ...current, email: event.target.value }))
              }
              className={underlineClass}
            />
          </label>
        ) : (
          <label className="block">
            <span className={labelClass}>Your email</span>
            <p className="mt-1 text-sm text-mute">
              For our records. Select Email above to list it on your profile.
            </p>
            <input
              type="text"
              autoComplete="email"
              value={draft.email}
              onChange={(event) =>
                setDraft((current) => ({ ...current, email: event.target.value }))
              }
              className={underlineClass}
            />
          </label>
        )}

        {draft.outreach.includes("phone") ? (
          <label className="block">
            <span className={labelClass}>Phone number</span>
            <input
              type="text"
              autoComplete="tel"
              value={draft.phone}
              onChange={(event) =>
                setDraft((current) => ({ ...current, phone: event.target.value }))
              }
              className={underlineClass}
            />
          </label>
        ) : null}

        {draft.outreach.includes("text") ? (
          <label className="block">
            <span className={labelClass}>Number for texts</span>
            <input
              type="text"
              autoComplete="tel"
              value={draft.phone}
              onChange={(event) =>
                setDraft((current) => ({ ...current, phone: event.target.value }))
              }
              className={underlineClass}
            />
          </label>
        ) : null}
      </section>

      <label className="block">
        <span className={labelClass}>Feedback for us</span>
        <p className="mt-1 text-sm text-mute">
          Optional — we&apos;re in testing, so anything you&apos;d flag is welcome.
        </p>
        <textarea
          rows={3}
          value={draft.feedback}
          onChange={(event) =>
            setDraft((current) => ({ ...current, feedback: event.target.value }))
          }
          className="mt-3 w-full rounded-2xl border border-line bg-paper px-4 py-3 outline-none placeholder:text-mute/80 focus:border-clay"
          placeholder="Confusing steps, missing fields, bugs, ideas — anything at all."
        />
      </label>
    </div>
  );
}
