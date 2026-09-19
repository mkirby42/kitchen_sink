import { describe, expect, it } from "vitest";
import { joinPath, routes } from "@/lib/routes";

describe("judge path routes", () => {
  it("exposes home, find, join, matches, and therapist profile", () => {
    expect(routes.home).toBe("/");
    expect(routes.find).toBe("/find");
    expect(routes.join).toBe("/join");
    expect(routes.joinSignIn).toBe("/join?mode=signin");
    expect(routes.joinEdit).toBe("/join?edit=1");
    expect(routes.matches).toBe("/matches");
    expect(routes.therapist("maya")).toBe("/t/maya");
  });

  it("keeps edit + step on the same join path", () => {
    expect(joinPath({ edit: true, step: 2 })).toBe("/join?edit=1&step=2");
  });
});
