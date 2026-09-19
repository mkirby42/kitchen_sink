import { describe, expect, it } from "vitest";
import {
  formatStartingRate,
  formatUsdFromCents,
} from "@/lib/therapists/display";

describe("starting rate display", () => {
  it("formats Maya's seed rate as $165", () => {
    expect(formatUsdFromCents(16500)).toBe("$165");
  });

  it("pairs the lowest price with its duration", () => {
    expect(formatStartingRate(16500, 50)).toEqual({
      price: "$165",
      duration: "50 min",
    });
  });

  it("omits duration when the therapist has no rate length", () => {
    expect(formatStartingRate(16500, null)).toEqual({
      price: "$165",
      duration: null,
    });
  });

  it("returns null when there is no price", () => {
    expect(formatStartingRate(null, 50)).toBeNull();
  });
});
