import { describe, expect, it } from "vitest";
import { routes } from "@/lib/routes";

describe("judge path routes", () => {
  it("exposes home, find, join, matches, and therapist profile", () => {
    expect(routes.home).toBe("/");
    expect(routes.find).toBe("/find");
    expect(routes.join).toBe("/join");
    expect(routes.matches).toBe("/matches");
    expect(routes.therapist("maya")).toBe("/t/maya");
  });
});
