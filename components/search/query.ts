import { routes } from "@/lib/routes";
import type { SearchFilters } from "@/lib/search/rpc";
import { allowedLicenseState, allowedSearchTags } from "@/lib/tags/presets";

const FIND_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type FindPageView = {
  /** Grid is the desktop default. `one` keeps the carousel. */
  layout: "grid" | "one";
  /** Extra grid pages beyond the first 8. 0 is the default and stays off the URL. */
  more: number;
  /** Open desktop profile. Null on the grid and the carousel. */
  therapistId: string | null;
};

export function parseFindPageView(
  searchParams: Record<string, string | string[] | undefined>,
): FindPageView {
  const layout = firstParam(searchParams.layout) === "one" ? "one" : "grid";
  const moreRaw = firstParam(searchParams.more)?.trim() ?? "";
  const moreNum = /^\d+$/.test(moreRaw) ? Number(moreRaw) : 0;
  const more = moreNum >= 1 && moreNum <= 3 ? moreNum : 0;
  const therapist = firstParam(searchParams.t)?.trim() ?? "";
  return {
    layout,
    more,
    therapistId: FIND_ID.test(therapist) ? therapist : null,
  };
}

export function findViewFromSearchParams(params: {
  get(name: string): string | null;
}): FindPageView {
  return parseFindPageView({
    layout: params.get("layout") ?? undefined,
    more: params.get("more") ?? undefined,
    t: params.get("t") ?? undefined,
  });
}

function findQueryString(
  filters: SearchFilters,
  view?: Partial<FindPageView>,
) {
  const params = new URLSearchParams();
  if (filters.tags.length) params.set("tags", filters.tags.join(","));
  if (filters.virtual) params.set("virtual", "1");
  if (filters.inPerson) params.set("in_person", "1");
  if (filters.state) params.set("state", filters.state);
  if (view?.layout === "one") params.set("layout", "one");
  if (view?.more && view.more > 0) {
    params.set("more", String(Math.min(3, view.more)));
  }
  if (view?.therapistId && FIND_ID.test(view.therapistId)) {
    params.set("t", view.therapistId);
  }
  return params.toString();
}

export function buildFindHref(
  filters: SearchFilters,
  view?: Partial<FindPageView>,
) {
  const qs = findQueryString(filters, view);
  return qs ? `${routes.find}?${qs}` : routes.find;
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** The address-bar filters before preset and state-code checks. */
export function requestFindHref(
  searchParams: Record<string, string | string[] | undefined>,
) {
  const tags = (Array.isArray(searchParams.tags)
    ? searchParams.tags.join(",")
    : (searchParams.tags ?? "")
  )
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const params = new URLSearchParams();
  if (tags.length) params.set("tags", tags.join(","));
  if (firstParam(searchParams.virtual) === "1") params.set("virtual", "1");
  if (firstParam(searchParams.in_person) === "1") params.set("in_person", "1");
  const state = firstParam(searchParams.state)?.trim();
  if (state) params.set("state", state);
  const qs = params.toString();
  return qs ? `${routes.find}?${qs}` : routes.find;
}

/**
 * Find-page address, including layout / more / t, before those values are
 * checked. Junk in those keys makes this differ from `buildFindHref`, so the
 * page can redirect it away. Profile links stay on `requestFindHref`.
 */
export function requestFindPageHref(
  searchParams: Record<string, string | string[] | undefined>,
) {
  const base = requestFindHref(searchParams);
  const params = new URLSearchParams(
    base.startsWith(`${routes.find}?`) ? base.slice(routes.find.length + 1) : "",
  );
  const layout = firstParam(searchParams.layout)?.trim();
  if (layout) params.set("layout", layout);
  const more = firstParam(searchParams.more)?.trim();
  if (more) params.set("more", more);
  const therapist = firstParam(searchParams.t)?.trim();
  if (therapist) params.set("t", therapist);
  const qs = params.toString();
  return qs ? `${routes.find}?${qs}` : routes.find;
}

export function buildTherapistHref(id: string, filters: SearchFilters) {
  const qs = findQueryString(filters);
  return qs ? `${routes.therapist(id)}?${qs}` : routes.therapist(id);
}

export function resultCountLabel(count: number) {
  return `${count} therapist${count === 1 ? "" : "s"}`;
}

export function filtersFromSearchParams(params: {
  get(name: string): string | null;
}): SearchFilters {
  return {
    tags: allowedSearchTags(
      (params.get("tags") ?? "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
    virtual: params.get("virtual") === "1",
    inPerson: params.get("in_person") === "1",
    state: allowedLicenseState(params.get("state")),
  };
}
