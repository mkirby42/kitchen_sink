import { describe, expect, it } from "vitest";
import { joinPath, routes } from "@/lib/routes";

describe("judge path routes", () => {
  it("exposes home, find, join, and therapist profile", () => {
    expect(routes.home).toBe("/");
    expect(routes.find).toBe("/find");
    expect(routes.join).toBe("/join");
    expect(routes.forTherapists).toBe("/for-therapists");
    expect(routes.joinSignIn).toBe("/join?mode=signin");
    expect(routes.forgotPassword).toBe("/forgot-password");
    expect(routes.resetPassword).toBe("/reset-password");
    expect(routes.joinEdit).toBe("/join?edit=1");
    expect(routes.profileDeleted).toBe("/profile-deleted");
    expect(routes.adminMedia).toBe("/admin/media");
    expect(routes.adminReviews).toBe("/admin/reviews");
    expect(routes.adminStarts).toBe("/admin/starts");
    expect(routes.adminAnalytics).toBe("/admin/analytics");
    expect(routes.therapist("maya")).toBe("/t/maya");
    expect(routes).not.toHaveProperty("matches");
  });

  it("keeps edit + step on the same join path", () => {
    expect(joinPath({ edit: true, step: 2 })).toBe("/join?edit=1&step=2");
    expect(joinPath({ edit: true, profile: "abc", step: 2 })).toBe(
      "/join?edit=1&profile=abc&step=2",
    );
    expect(joinPath({ edit: true, forId: "abc", step: 2 })).toBe(
      "/join?edit=1&for=abc&step=2",
    );
  });
});
