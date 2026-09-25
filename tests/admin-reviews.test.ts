import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import {
  approveReview,
  moderationError,
  rejectReview,
  toPendingReview,
} from "@/lib/admin/reviews";

describe("pending review queue", () => {
  it("labels the author and falls back when the therapist name is missing", () => {
    expect(
      toPendingReview(
        {
          id: "rev-1",
          therapist_id: "therapist-1",
          author_name: null,
          anonymous: true,
          stars_cat_1: "5",
          stars_cat_2: 4,
          stars_cat_3: null,
          body: "Kind.",
          created_at: "2026-03-01T15:00:00.000Z",
        },
        "  ",
      ),
    ).toEqual({
      id: "rev-1",
      therapistId: "therapist-1",
      therapistName: "Therapist",
      authorLabel: "Anonymous",
      understood: 5,
      communication: 4,
      fit: null,
      body: "Kind.",
      createdAt: "2026-03-01T15:00:00.000Z",
    });
  });

  it("approves only a pending row", async () => {
    const filters: string[] = [];
    const supabase = fakeClient({
      filters,
      rows: [{ id: "rev-1", status: "approved" }],
    });

    await approveReview(supabase, "rev-1");
    expect(filters).toEqual(["id=rev-1", "status=pending"]);
  });

  it("rejects by deleting the pending row", async () => {
    const filters: string[] = [];
    const supabase = fakeClient({
      filters,
      rows: [{ id: "rev-1" }],
    });

    await rejectReview(supabase, "rev-1");
    expect(filters).toEqual(["id=rev-1", "status=pending"]);
  });

  it("does not treat a missed delete as success", async () => {
    const supabase = fakeClient({ filters: [], rows: [] });
    await expect(rejectReview(supabase, "rev-1")).rejects.toThrow(
      "That review is no longer pending.",
    );
    expect(moderationError({ code: "42501", message: "permission denied" })).toBe(
      "Admin access is required.",
    );
  });
});

function fakeClient(handlers: {
  filters: string[];
  rows: { id: string; status?: string }[];
}) {
  const chain = {
    eq(column: string, value: string) {
      handlers.filters.push(`${column}=${value}`);
      return chain;
    },
    select: async () => ({ data: handlers.rows, error: null }),
  };

  return {
    from() {
      return {
        update() {
          return chain;
        },
        delete() {
          return chain;
        },
      };
    },
  } as unknown as SupabaseClient;
}
