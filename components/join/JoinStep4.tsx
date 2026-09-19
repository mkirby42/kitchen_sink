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

export function JoinStep4({
  draft,
  setDraft,
}: {
  draft: JoinDraft;
  setDraft: Dispatch<SetStateAction<JoinDraft>>;
}) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("all");
  const [activePrompt, setActivePrompt] = useState<{
    prompt: string;
    tag: string;
  } | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [customAnswer, setCustomAnswer] = useState("");

  const usedServices = new Set(draft.rates.map((rate) => rate.service_type));
  const availableService = RATE_SERVICE_TYPES.find(
    (service) => !usedServices.has(service),
  );
  const filteredPrompts = CONVERSATION_PROMPTS.filter(
    (item) => filter === "all" || item.tag === filter,
  );

  function setPromptAnswer(prompt: string, tag: string, answer: string) {
    setDraft((current) => {
      const existing = current.cards.findIndex((card) => card.prompt === prompt);
      if (existing === -1) {
        return {
          ...current,
          cards: [...current.cards, { prompt, tag, answer }],
        };
      }
      return {
        ...current,
        cards: current.cards.map((card, index) =>
          index === existing ? { ...card, answer } : card,
        ),
      };
    });
  }

  function addCustomCard() {
    const prompt = customPrompt.trim();
    const answer = customAnswer.trim();
    if (!prompt || !answer) return;
    setDraft((current) => ({
      ...current,
      cards: [...current.cards, { prompt, answer, tag: "custom" }],
    }));
    setCustomPrompt("");
    setCustomAnswer("");
    setShowCustom(false);
  }

  return (
    <div className="space-y-10">
      <fieldset>
        <legend className="text-xs font-semibold tracking-[0.16em] text-mute uppercase">
          Rates
        </legend>
        <div className="mt-4 space-y-4">
          {draft.rates.map((rate, index) => (
            <div
              key={index}
              className="grid gap-4 rounded-2xl bg-cream p-4 sm:grid-cols-[1fr_7rem_8rem_auto]"
            >
              <label>
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
                  className="w-full border-b border-line bg-transparent py-2 outline-none focus:border-clay"
                >
                  {RATE_SERVICE_TYPES.map((service) => (
                    <option
                      key={service}
                      value={service}
                      disabled={
                        service !== rate.service_type && usedServices.has(service)
                      }
                    >
                      {service}
                    </option>
                  ))}
                </select>
              </label>
              <label>
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
                  className="w-full border-b border-line bg-transparent py-2 outline-none focus:border-clay"
                >
                  {RATE_DURATIONS.map((duration) => (
                    <option key={duration} value={duration}>
                      {duration} min
                    </option>
                  ))}
                </select>
              </label>
              <label className="relative">
                <span className="absolute left-0 top-2 text-mute">$</span>
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
                  className="w-full border-b border-line bg-transparent py-2 pl-4 outline-none focus:border-clay"
                />
              </label>
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
                className="size-9 rounded-full text-xl text-mute hover:bg-paper hover:text-clay disabled:cursor-not-allowed disabled:opacity-30"
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
          className="mt-4 w-full rounded-2xl border border-dashed border-clay/50 px-5 py-3 text-sm font-semibold text-clay hover:bg-cream disabled:cursor-not-allowed disabled:opacity-40"
        >
          + Add another rate
        </button>
      </fieldset>

      <section className="border-t border-line pt-9">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-mute uppercase">
              Conversation cards
            </p>
            <h2 className="mt-2 font-display text-2xl">Give clients a feel for you</h2>
          </div>
          <p className="text-sm text-mute">
            {draft.cards.filter((card) => card.answer.trim()).length} of 3 added
          </p>
        </div>

        {draft.cards.length ? (
          <div className="mt-5 space-y-3">
            {draft.cards.map((card, index) => (
              <div
                key={`${card.prompt}-${index}`}
                className="flex gap-4 rounded-2xl border border-line bg-paper p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-display italic text-clay">{card.prompt}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                    {card.answer || "Add your answer below."}
                  </p>
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
                  className="size-8 shrink-0 rounded-full text-xl text-mute hover:bg-cream hover:text-clay"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          {FILTERS.map(([value, label]) => (
            <Chip
              key={value}
              selected={filter === value}
              onClick={() => setFilter(value)}
            >
              {label}
            </Chip>
          ))}
        </div>

        <div className="mt-5 divide-y divide-line rounded-2xl border border-line">
          {filteredPrompts.map((item) => {
            const isActive = activePrompt?.prompt === item.prompt;
            const answer =
              draft.cards.find((card) => card.prompt === item.prompt)?.answer ?? "";
            return (
              <div key={item.prompt} className="p-4">
                <button
                  type="button"
                  onClick={() =>
                    setActivePrompt(isActive ? null : { ...item })
                  }
                  className="flex w-full items-center justify-between gap-4 text-left"
                >
                  <span className="font-display italic text-clay">{item.prompt}</span>
                  <span className="text-xl">{isActive ? "−" : "+"}</span>
                </button>
                {isActive ? (
                  <textarea
                    autoFocus
                    rows={3}
                    value={answer}
                    onChange={(event) =>
                      setPromptAnswer(item.prompt, item.tag, event.target.value)
                    }
                    placeholder="Write your answer…"
                    className="mt-4 w-full rounded-2xl bg-cream p-4 outline-none focus:ring-1 focus:ring-clay"
                  />
                ) : null}
              </div>
            );
          })}
        </div>

        {!showCustom ? (
          <button
            type="button"
            onClick={() => setShowCustom(true)}
            className="mt-4 w-full rounded-2xl border border-dashed border-clay/50 px-5 py-3 text-sm font-semibold text-clay hover:bg-cream"
          >
            + Write your own prompt
          </button>
        ) : (
          <div className="mt-4 space-y-3 rounded-2xl bg-cream p-5">
            <input
              value={customPrompt}
              onChange={(event) => setCustomPrompt(event.target.value)}
              placeholder="Your question"
              className="w-full border-b border-line bg-transparent py-2 outline-none focus:border-clay"
            />
            <textarea
              rows={3}
              value={customAnswer}
              onChange={(event) => setCustomAnswer(event.target.value)}
              placeholder="Your answer"
              className="w-full rounded-2xl bg-paper p-4 outline-none focus:ring-1 focus:ring-clay"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={addCustomCard}
                className="rounded-full bg-clay px-4 py-2 text-sm font-semibold text-paper"
              >
                Add card
              </button>
              <button
                type="button"
                onClick={() => setShowCustom(false)}
                className="text-sm font-semibold text-mute"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      <label className="block border-t border-line pt-9">
        <span className="text-xs font-semibold tracking-[0.16em] text-mute uppercase">
          About you
        </span>
        <textarea
          rows={5}
          value={draft.about}
          onChange={(event) =>
            setDraft((current) => ({ ...current, about: event.target.value }))
          }
          className="mt-3 w-full rounded-2xl bg-cream p-5 outline-none focus:ring-1 focus:ring-clay"
          placeholder="Share what you want clients to know about you."
        />
      </label>

      <section className="space-y-6 border-t border-line pt-9">
        <label className="block">
          <span className="text-xs font-semibold tracking-[0.16em] text-mute uppercase">
            Your email
          </span>
          <input
            type="email"
            autoComplete="email"
            value={draft.email}
            onChange={(event) =>
              setDraft((current) => ({ ...current, email: event.target.value }))
            }
            className="mt-2 w-full border-b border-line bg-transparent py-3 text-lg outline-none focus:border-clay"
          />
          <span className="mt-2 block text-sm text-mute">
            For our records; this is also the public email when email outreach is
            selected.
          </span>
        </label>

        <fieldset>
          <legend className="text-xs font-semibold tracking-[0.16em] text-mute uppercase">
            How can clients reach you?
          </legend>
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

        {draft.outreach.some(
          (option) => option === "phone" || option === "text",
        ) ? (
          <label className="block">
            <span className="text-xs font-semibold tracking-[0.16em] text-mute uppercase">
              Phone number
            </span>
            <input
              type="tel"
              autoComplete="tel"
              value={draft.phone}
              onChange={(event) =>
                setDraft((current) => ({ ...current, phone: event.target.value }))
              }
              className="mt-2 w-full border-b border-line bg-transparent py-3 text-lg outline-none focus:border-clay"
            />
          </label>
        ) : null}
      </section>

      <label className="block border-t border-line pt-9">
        <span className="text-xs font-semibold tracking-[0.16em] text-mute uppercase">
          Optional product feedback
        </span>
        <textarea
          rows={3}
          value={draft.feedback}
          onChange={(event) =>
            setDraft((current) => ({ ...current, feedback: event.target.value }))
          }
          className="mt-3 w-full rounded-2xl bg-cream p-5 outline-none focus:ring-1 focus:ring-clay"
          placeholder="What would make this easier?"
        />
      </label>
    </div>
  );
}
