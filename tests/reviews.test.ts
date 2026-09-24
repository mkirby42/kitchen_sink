import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { categoryAverages, formatReviewDate, reviewAuthorLabel, reviewMeta } from "@/lib/reviews/format";
import { deleteOwnReview, reviewWriteError, submitReview } from "@/lib/reviews/submit";
import { validateReview } from "@/lib/reviews/validate";
import { toProfileReview, type ProfileReview } from "@/lib/therapists/load";

const ratings = { understood: 5, communication: 4, fit: 5 };

const draft = {
  authorName: "A. C.",
  anonymous: false,
  ratings,
  body: "  Clear and kind.  ",
};

describe("validateReview", () => {
  it("trims a named review and keeps a whole-number rating", () => {
    const result = validateReview(draft);
    expect(result).toEqual({
      ok: true,
      value: {
        authorName: "A. C.",
        anonymous: false,
        ratings,
        body: "Clear and kind.",
      },
    });
  });

  it("allows anonymous with no written note", () => {
    const result = validateReview({
      authorName: "ignored",
      anonymous: true,
      ratings,
      body: "   ",
    });
    expect(result).toEqual({
      ok: true,
      value: {
        authorName: null,
        anonymous: true,
        ratings,
        body: null,
      },
    });
  });

  it("rejects a missing name and any missing rating", () => {
    expect(validateReview({ ...draft, authorName: " " })).toMatchObject({
      ok: false,
      error: "Add a display name, or post anonymously.",
    });
    expect(
      validateReview({
        ...draft,
        ratings: { understood: 5, communication: null, fit: 4 },
      }),
    ).toMatchObject({
      ok: false,
      error: "Rate all three questions from 1 to 5.",
    });
    expect(
      validateReview({
        ...draft,
        ratings: { understood: 4.5, communication: 5, fit: 5 },
      }),
    ).toMatchObject({
      ok: false,
      error: "Rate all three questions from 1 to 5.",
    });
  });
});

describe("review display", () => {
  it("labels anonymous reviews and falls back when a legacy row has no name", () => {
    expect(
      reviewAuthorLabel({ anonymous: true, reviewer_name: "Secret" }),
    ).toBe("Anonymous");
    expect(reviewAuthorLabel({ anonymous: false, reviewer_name: "J. R." })).toBe(
      "J. R.",
    );
    expect(reviewAuthorLabel({ anonymous: false, reviewer_name: null })).toBe(
      "Client",
    );
  });

  it("maps a row without exposing patient id, and marks the signed-in author", () => {
    const review = toProfileReview(
      {
        id: "rev-1",
        patient_id: "patient-1",
        stars_avg: "4",
        stars_cat_1: "5",
        stars_cat_2: 5,
        stars_cat_3: 4,
        body: "Helpful.",
        session_format: "Virtual",
        duration_label: null,
        anonymous: true,
        author_name: "Should not show",
        created_at: "2026-03-01T15:00:00.000Z",
        patient_hidden: false,
      },
      "patient-1",
    );

    expect(review).toMatchObject({
      id: "rev-1",
      stars: 4,
      understood: 5,
      communication: 5,
      fit: 4,
      reviewer_name: null,
      anonymous: true,
      mine: true,
    });
    expect(review).not.toHaveProperty("patient_id");
  });

  it("formats the date into the meta line", () => {
    const iso = "2026-03-01T15:00:00.000Z";
    const review: Pick<
      ProfileReview,
      "session_format" | "duration_label" | "created_at"
    > = {
      session_format: "Virtual",
      duration_label: "8 months with Maya",
      created_at: iso,
    };
    expect(formatReviewDate(iso)).toBe(
      new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    );
    expect(formatReviewDate("nope")).toBeNull();
    expect(reviewMeta(review)).toContain("Virtual · 8 months with Maya · ");
  });

  it("averages each question into the reviews-tab breakdown", () => {
    const rows = categoryAverages([
      { understood: 5, communication: 5, fit: 5 },
      { understood: 5, communication: 5, fit: 4 },
      { understood: 4, communication: 5, fit: 4 },
    ]);
    expect(rows.map((row) => [row.label, row.average])).toEqual([
      ["Felt understood", 4.7],
      ["Communication", 5],
      ["Right fit", 4.3],
    ]);
  });
});

describe("submitReview", () => {
  it("inserts one row for the patient profile", async () => {
    const inserted: unknown[] = [];
    const supabase = fakeClient({
      insert: async (row) => {
        inserted.push(row);
        return { error: null };
      },
    });

    await submitReview(supabase, "therapist-1", draft);

    expect(inserted).toEqual([
      {
        therapist_id: "therapist-1",
        patient_id: "patient-1",
        author_name: "A. C.",
        anonymous: false,
        stars_cat_1: 5,
        stars_cat_2: 4,
        stars_cat_3: 5,
        body: "Clear and kind.",
      },
    ]);
  });

  it("updates the existing row when the patient already reviewed", async () => {
    const updated: unknown[] = [];
    const supabase = fakeClient({
      insert: async () => ({ error: { code: "23505", message: "duplicate" } }),
      update: async (row) => {
        updated.push(row);
        return { error: null };
      },
    });

    await submitReview(supabase, "therapist-1", {
      ...draft,
      anonymous: true,
    });

    expect(updated).toEqual([
      {
        author_name: null,
        anonymous: true,
        stars_cat_1: 5,
        stars_cat_2: 4,
        stars_cat_3: 5,
        body: "Clear and kind.",
      },
    ]);
  });

  it("hides raw database errors", async () => {
    const supabase = fakeClient({
      insert: async () => ({
        error: { code: "42501", message: "new row violates row-level security" },
      }),
    });

    await expect(submitReview(supabase, "therapist-1", draft)).rejects.toThrow(
      "Sign in as a client to leave a review.",
    );
    expect(reviewWriteError({ message: "Add a display name, or post anonymously." })).toBe(
      "Add a display name, or post anonymously.",
    );
  });

  it("deletes only the signed-in patient's row", async () => {
    const filters: string[] = [];
    const supabase = fakeClient({
      userId: "patient-1",
      deleteEq: (column, value) => {
        filters.push(`${column}=${value}`);
      },
    });

    await deleteOwnReview(supabase, "therapist-1");
    expect(filters).toEqual([
      "therapist_id=therapist-1",
      "patient_id=patient-1",
    ]);
  });
});

function fakeClient(handlers: {
  userId?: string | null;
  insert?: (row: unknown) => Promise<{ error: { code?: string; message: string } | null }>;
  update?: (row: unknown) => Promise<{ error: { code?: string; message: string } | null }>;
  deleteEq?: (column: string, value: string) => void;
}) {
  return {
    rpc: async () => ({ data: "patient-1", error: null }),
    auth: {
      getUser: async () => ({
        data: {
          user: handlers.userId === null ? null : { id: handlers.userId ?? "patient-1" },
        },
        error: null,
      }),
    },
    from() {
      return {
        insert: handlers.insert ?? (async () => ({ error: null })),
        update(row: unknown) {
          return {
            eq() {
              return {
                eq: () => handlers.update?.(row) ?? Promise.resolve({ error: null }),
              };
            },
          };
        },
        delete() {
          return {
            eq(column: string, value: string) {
              handlers.deleteEq?.(column, value);
              return {
                eq: async (column2: string, value2: string) => {
                  handlers.deleteEq?.(column2, value2);
                  return { error: null };
                },
              };
            },
          };
        },
      };
    },
  } as unknown as SupabaseClient;
}
