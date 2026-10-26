import { sentenceCasePhrase } from "@/lib/copy/sentence-case";
import {
  desktopInsuranceLabels,
  licensedInLabel,
} from "@/lib/search/find-desktop";
import type { SearchFilters, SearchRow } from "@/lib/search/rpc";
import { isSelectedFindTopic } from "@/lib/tags/plain-language";
import {
  FIND_TOPIC_OTHER,
  INSURANCE_PRESETS,
  SPECIALTY_PRESETS,
  isFindInsuranceChoice,
  licenseStateLabel,
} from "@/lib/tags/presets";
import { yearsPracticing } from "@/lib/therapists/display";
import { hasSuperbill, inNetworkInsurance } from "@/lib/therapists/insurance";

export type PhoneSheet = "place" | "insurance" | "topics" | "format";

export type PhonePill = {
  id: PhoneSheet;
  label: string;
  pressed: boolean;
};

const INSURANCE = new Set<string>(INSURANCE_PRESETS);
const SPECIALTY = new Set<string>(SPECIALTY_PRESETS);

export const SUPERBILL_NOTE = "Paying yourself? Get reimbursed later";

export const SWIPE_HINT = "Swipe for the next therapist";

export function therapistsFitLabel(count: number) {
  return count === 1 ? "1 therapist fits" : `${count} therapists fit`;
}

export function phonePills(filters: SearchFilters): PhonePill[] {
  const insurance = filters.tags.filter((tag) => isFindInsuranceChoice(tag));
  let insuranceLabel = "Insurance";
  if (insurance.length === 1) insuranceLabel = sentenceCasePhrase(insurance[0]);
  else if (insurance.length > 1) insuranceLabel = `Insurance · ${insurance.length}`;

  let formatLabel = "In person or online";
  if (filters.inPerson && filters.virtual) formatLabel = "In person · Online";
  else if (filters.inPerson) formatLabel = "In person";
  else if (filters.virtual) formatLabel = "Online";

  return [
    {
      id: "place",
      label: filters.state ? licenseStateLabel(filters.state) : "Where you live",
      pressed: Boolean(filters.state),
    },
    {
      id: "insurance",
      label: insuranceLabel,
      pressed: insurance.length > 0,
    },
    {
      id: "topics",
      label: "What's going on",
      pressed: filters.tags.some((tag) => isSelectedFindTopic(tag)),
    },
    {
      id: "format",
      label: formatLabel,
      pressed: filters.virtual || filters.inPerson,
    },
  ];
}

/** Clears the open sheet. Insurance tags stay when the topic sheet clears. */
export function clearPhoneSheet(
  filters: SearchFilters,
  sheet: PhoneSheet,
): SearchFilters {
  if (sheet === "place") return { ...filters, state: null };
  if (sheet === "format") return { ...filters, virtual: false, inPerson: false };
  if (sheet === "insurance") {
    return {
      ...filters,
      tags: filters.tags.filter((tag) => !isFindInsuranceChoice(tag)),
    };
  }
  return {
    ...filters,
    tags: filters.tags.filter(
      (tag) => !SPECIALTY.has(tag) && tag !== FIND_TOPIC_OTHER,
    ),
  };
}

/** In-network plans this therapist actually takes. A selected insurance filter narrows the line. */
export function takesPlans(labels: readonly string[], filters: SearchFilters) {
  const network = inNetworkInsurance([...labels]);
  const selected = filters.tags.filter(
    (tag) => INSURANCE.has(tag) && inNetworkInsurance([tag]).length > 0,
  );
  const source = selected.length
    ? network.filter((plan) => selected.includes(plan))
    : network;
  return desktopInsuranceLabels(source);
}

const WORK_BEST = /work best with/i;

/** Mockup label. Stored prompts are “who I work best with...” or “I work best with...”. */
export const PHONE_LIST_WORK_BEST_LABEL = "I work best with...";

/**
 * Quote under the phone list portrait. Prefer the saved who-I-work-best-with
 * card (loaded profile cards, or the one already on the search row). Otherwise
 * the first conversation card. Null when nothing is saved.
 */
export function phoneListQuote(
  row: Pick<SearchRow, "card_prompt" | "card_answer">,
  cards?: readonly { prompt: string; answer: string }[],
) {
  const saved = (cards ?? [])
    .map((card) => ({
      prompt: card.prompt.trim(),
      answer: card.answer.trim(),
    }))
    .filter((card) => card.prompt && card.answer);
  const prompt = row.card_prompt?.trim() ?? "";
  const answer = row.card_answer?.trim() ?? "";
  const fromRow = prompt && answer ? { prompt, answer } : null;
  const best =
    saved.find((card) => WORK_BEST.test(card.prompt)) ??
    (fromRow && WORK_BEST.test(fromRow.prompt) ? fromRow : null);
  const chosen = best ?? saved[0] ?? fromRow;
  if (!chosen) return null;
  return {
    label: WORK_BEST.test(chosen.prompt) ? PHONE_LIST_WORK_BEST_LABEL : chosen.prompt,
    answer: chosen.answer,
  };
}

export function phoneListFacts(
  row: Pick<SearchRow, "insurance_labels" | "start_date_of_practice">,
  filters: SearchFilters,
  now = new Date(),
) {
  const facts: string[] = [];
  const plans = takesPlans(row.insurance_labels, filters);
  if (plans.length) facts.push(`Takes ${plans.join(", ")}`);
  const years = yearsPracticing(row.start_date_of_practice, now);
  if (years != null) facts.push(`${years} yrs`);
  return facts;
}

export function formatFacts(virtual: boolean, inPerson: boolean) {
  const facts: string[] = [];
  if (inPerson) facts.push("In person");
  if (virtual) facts.push("Online");
  return facts;
}

export function licenseFacts(states: readonly string[], filterState: string | null) {
  const codes = states.length ? states : filterState ? [filterState] : [];
  const seen = new Set<string>();
  const facts: string[] = [];
  for (const code of codes) {
    const label = licensedInLabel(code.trim().toUpperCase());
    if (!label || seen.has(label)) continue;
    seen.add(label);
    facts.push(label);
  }
  return facts;
}

export function yearsFact(
  start: string | null | undefined,
  now = new Date(),
) {
  const years = yearsPracticing(start, now);
  if (years == null) return null;
  return `${years} yrs`;
}

export type StackCard = { prompt: string; answer: string };

export function stackCards(
  row: Pick<SearchRow, "card_prompt" | "card_answer">,
  cards: readonly StackCard[] | undefined,
): StackCard[] {
  const stored = (cards ?? [])
    .map((card) => ({
      prompt: card.prompt.trim(),
      answer: card.answer.trim(),
    }))
    .filter((card) => card.prompt && card.answer);
  if (stored.length) return stored;
  const prompt = row.card_prompt?.trim() ?? "";
  const answer = row.card_answer?.trim() ?? "";
  if (!prompt || !answer) return [];
  return [{ prompt, answer }];
}

/** Which pinned label to show. The button opens the contact sheet, not this href. */
export function phoneBookAction(
  contact: readonly { kind: string }[] | null | undefined,
) {
  if (contact?.some((item) => item.kind === "email")) {
    return { label: "Book a free consult", cta: "consult" as const };
  }
  if (contact?.some((item) => item.kind === "phone" || item.kind === "text")) {
    return { label: "Book a session", cta: "book" as const };
  }
  return null;
}

export function showSuperbill(labels: readonly string[], flag: boolean) {
  return hasSuperbill([...labels], flag);
}

export type MatchSlot = {
  index: number;
  count: number;
  prevIndex: number | null;
  nextIndex: number | null;
};

/** Null when this profile is not in a multi-result set. One result has nothing to swipe. */
export function matchSlot(
  ids: readonly string[],
  id: string,
): MatchSlot | null {
  if (ids.length < 2) return null;
  const index = ids.indexOf(id);
  if (index < 0) return null;
  return {
    index,
    count: ids.length,
    prevIndex: index > 0 ? index - 1 : null,
    nextIndex: index < ids.length - 1 ? index + 1 : null,
  };
}

export function swipeForLabel(position: number, count: number) {
  return `Swipe for ${position} of ${count}`;
}
