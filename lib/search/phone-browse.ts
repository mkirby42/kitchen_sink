import type { SearchFilters } from "@/lib/search/rpc";

/** Phone Find results. One column per therapist; the page still scrolls vertically. */
export const phoneScrollerClass =
  "-mx-5 grid min-w-0 snap-x snap-mandatory grid-flow-col auto-cols-[100%] items-start overflow-x-auto overflow-y-clip scroll-smooth overscroll-x-contain [touch-action:pan-x_pan-y] motion-reduce:scroll-auto [scrollbar-width:none] sm:-mx-8";

/** Matches the Find page padding (`px-5 sm:px-8`) so a card lines up with the filters. */
export const phoneSlideClass =
  "min-w-0 snap-start px-5 pt-1 pb-8 [scroll-snap-stop:always] sm:px-8";

export const phoneBrowseRootClass = "md:hidden";

export function clampIndex(index: number, count: number) {
  if (count <= 0) return 0;
  return Math.min(count - 1, Math.max(0, index));
}

/** Swipe left / Next is +1. Swipe right / Previous is -1. Stops at the ends. */
export function browseStep(index: number, count: number, direction: -1 | 1) {
  return clampIndex(index + direction, count);
}

/**
 * Remount the phone browse when the filter set or the result ids change,
 * so the scroller returns to the first card.
 */
export function phoneBrowseKey(filters: SearchFilters, ids: readonly string[]) {
  return [
    filters.virtual ? "1" : "0",
    filters.inPerson ? "1" : "0",
    filters.state ?? "",
    filters.tags.join("\u001f"),
    ids.join("\u001f"),
  ].join("|");
}
