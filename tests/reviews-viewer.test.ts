import { describe, expect, it } from "vitest";
import { loadReviewViewer } from "@/lib/reviews/viewer";

function client(role: string | null, userId = "user-1") {
  return {
    auth: {
      getUser: async () => ({ data: { user: { id: userId } } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: role ? { role } : null }),
        }),
      }),
    }),
  };
}

describe("loadReviewViewer", () => {
  it("keeps admin so they can review another therapist", async () => {
    const viewer = await loadReviewViewer(
      client("admin", "admin-1") as never,
      "matt-id",
    );
    expect(viewer).toEqual({
      userId: "admin-1",
      role: "admin",
      isOwner: false,
    });
  });

  it("marks an admin as the owner of their own test profile", async () => {
    const viewer = await loadReviewViewer(
      client("admin", "admin-1") as never,
      "admin-1",
    );
    expect(viewer.isOwner).toBe(true);
    expect(viewer.role).toBe("admin");
  });

  it("still treats a therapist as a therapist", async () => {
    const viewer = await loadReviewViewer(
      client("therapist", "therapist-1") as never,
      "other-id",
    );
    expect(viewer).toEqual({
      userId: "therapist-1",
      role: "therapist",
      isOwner: false,
    });
  });
});
