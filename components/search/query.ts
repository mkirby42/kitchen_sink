import { routes } from "@/lib/routes";
import type { SearchFilters } from "@/lib/search/rpc";

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
    tags: (params.get("tags") ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    virtual: params.get("virtual") === "1",
    inPerson: params.get("in_person") === "1",
    state: params.get("state")?.trim() || null,
  };
}
