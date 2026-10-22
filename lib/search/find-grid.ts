import { yearsPracticing } from "@/lib/therapists/display";
import { desktopInsuranceLabels } from "@/lib/search/find-desktop";

/** Desktop grid page. The search already caps the directory at 24. */
export const FIND_GRID_PAGE_SIZE = 8;

const NOT_A_PLAN = new Set(["out-of-network superbill", "cash pay only"]);

export function gridVisibleCount(total: number, morePages: number) {
  const pages = Math.max(0, morePages) + 1;
  return Math.min(Math.max(0, total), pages * FIND_GRID_PAGE_SIZE);
}

/** Null when every result is already on screen. Names the real remainder. */
export function gridShowMoreLabel(total: number, visible: number) {
  const remaining = Math.max(0, total - visible);
  if (remaining <= 0) return null;
  const next = Math.min(FIND_GRID_PAGE_SIZE, remaining);
  return `Show ${next} more`;
}

export function gridFitLine(count: number) {
  const verb = count === 1 ? "fits" : "fit";
  const noun = count === 1 ? "therapist" : "therapists";
  return `${count} ${noun} ${verb} what you told us`;
}

/** Short years line for the compact card and the detail facts. */
export function gridYearsLabel(
  start: string | null | undefined,
  now = new Date(),
) {
  const years = yearsPracticing(start, now);
  if (years == null) return null;
  const noun = years === 1 ? "yr" : "yrs";
  return `${years} ${noun} in practice`;
}

function planLabels(labels: readonly string[]) {
  return desktopInsuranceLabels(labels).filter(
    (label) => !NOT_A_PLAN.has(label.toLowerCase()),
  );
}

/**
 * Selected insurance the therapist accepts. With no insurance filter, the
 * first plan they take — still one fact, not the whole list.
 */
export function takesInsuranceLine(
  labels: readonly string[],
  selected: readonly string[],
) {
  const plans = planLabels(labels);
  if (plans.length === 0) return null;
  const wanted = new Set(selected.map((tag) => tag.toLowerCase()));
  const matched = plans.filter((plan) => wanted.has(plan.toLowerCase()));
  const shown = matched.length > 0 ? matched : [plans[0]];
  return `Takes ${shown.join(", ")}`;
}

export function detailInsuranceLine(labels: readonly string[]) {
  const plans = planLabels(labels);
  return plans.length > 0 ? plans.join(", ") : null;
}
