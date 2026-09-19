import { describe, expect, it } from "vitest";
import { interestAlias } from "@/lib/interest/alias";

describe("interestAlias", () => {
  it("uses the last 4 hex chars of the patient UUID", () => {
    expect(interestAlias("22222222-2222-4222-8222-222222222222")).toBe(
      "Patient · 2222",
    );
    expect(interestAlias("33333333-3333-4333-8333-333333333333")).toBe(
      "Patient · 3333",
    );
    expect(interestAlias("44444444-4444-4444-8444-444444444444")).toBe(
      "Patient · 4444",
    );
  });
});
