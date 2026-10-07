import { describe, expect, it } from "vitest";
import { formatUsdFromCents } from "@/lib/therapists/display";

describe("usd display", () => {
  it("formats a profile rate as whole dollars", () => {
    expect(formatUsdFromCents(16500)).toBe("$165");
  });

  it("returns null when there is no price", () => {
    expect(formatUsdFromCents(null)).toBeNull();
    expect(formatUsdFromCents(undefined)).toBeNull();
  });
});
