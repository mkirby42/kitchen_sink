import { routes } from "@/lib/routes";
import type { SearchFilters } from "@/lib/search/rpc";
import { allowedLicenseState, allowedSearchTags } from "@/lib/tags/presets";

function findQueryString(filters: SearchFilters) {
  const params = new URLSearchParams();
  if (filters.tags.length) params.set("tags", filters.tags.join(","));
  if (filters.virtual) params.set("virtual", "1");
  if (filters.inPerson) params.set("in_person", "1");
  if (filters.state) params.set("state", filters.state);
  return params.toString();
}

export function buildFindHref(filters: SearchFilters) {
  const qs = findQueryString(filters);
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
