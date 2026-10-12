import type { JoinRate } from "@/lib/join/types";
import { RATE_SERVICE_TYPES } from "@/lib/tags/presets";

/** Stored custom labels, and the preset names, stay within this length. */
export const RATE_SERVICE_LABEL_MAX = 80;

/** Select value for a therapist-written rate name. Never stored. */
export const CUSTOM_RATE_SERVICE = "__custom__";

const PRESET_BY_LOWER = new Map(
  RATE_SERVICE_TYPES.map((service) => [service.toLowerCase(), service]),
);

export function collapseRateLabel(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function isPresetRateService(label: string): boolean {
  return (RATE_SERVICE_TYPES as readonly string[]).includes(label);
}

/**
 * Trim, collapse spaces, and map a preset's spelling back to the canonical
 * label. Null when the label is empty or longer than the stored maximum.
 */
export function normalizeRateServiceType(raw: string): string | null {
  const label = collapseRateLabel(raw);
  if (!label || label.length > RATE_SERVICE_LABEL_MAX) return null;
  return PRESET_BY_LOWER.get(label.toLowerCase()) ?? label;
}

export function rateServiceLabelIssue(raw: string): "empty" | "long" | null {
  const label = collapseRateLabel(raw);
  if (!label) return "empty";
  if (label.length > RATE_SERVICE_LABEL_MAX) return "long";
  return null;
}

/** Value to store on blur. A taken preset stays as typed so the custom field remains. */
export function commitRateServiceType(
  raw: string,
  otherLabels: readonly string[],
): string {
  const collapsed = collapseRateLabel(raw);
  const normalized = normalizeRateServiceType(raw);
  if (!normalized) return collapsed;
  const taken = otherLabels.some((other) => {
    const otherNormalized = normalizeRateServiceType(other);
    return otherNormalized?.toLowerCase() === normalized.toLowerCase();
  });
  if (taken && isPresetRateService(normalized)) return collapsed;
  return normalized;
}

/** Next row: the next unused preset, or a blank custom label once those are taken. */
export function nextRate(
  rates: readonly { service_type: string }[],
): JoinRate {
  const used = new Set(
    rates.flatMap((rate) => {
      const normalized = normalizeRateServiceType(rate.service_type);
      return normalized && isPresetRateService(normalized) ? [normalized] : [];
    }),
  );
  const available = RATE_SERVICE_TYPES.find((service) => !used.has(service));
  return {
    service_type: available ?? "",
    duration_minutes: 50,
    price_cents: 0,
  };
}
