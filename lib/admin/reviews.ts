import type { SupabaseClient } from "@supabase/supabase-js";
import { reviewAuthorLabel } from "@/lib/reviews/text";

export type PendingReview = {
  id: string;
  therapistId: string;
  therapistName: string;
  authorLabel: string;
  understood: number | null;
  communication: number | null;
  fit: number | null;
  body: string | null;
  createdAt: string;
};

type PendingRow = {
  id: string;
  therapist_id: string;
  author_name: string | null;
  anonymous: boolean | null;
  stars_cat_1: number | string | null;
  stars_cat_2: number | string | null;
  stars_cat_3: number | string | null;
  body: string | null;
  created_at: string;
};

function numeric(value: number | string | null | undefined) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function toPendingReview(
  row: PendingRow,
  therapistName: string | null | undefined,
): PendingReview {
  const name = therapistName?.trim();
  return {
    id: row.id,
    therapistId: row.therapist_id,
    therapistName: name || "Therapist",
    authorLabel: reviewAuthorLabel({
      anonymous: Boolean(row.anonymous),
      reviewer_name: row.author_name,
    }),
    understood: numeric(row.stars_cat_1),
    communication: numeric(row.stars_cat_2),
    fit: numeric(row.stars_cat_3),
    body: row.body,
    createdAt: row.created_at,
  };
}

type WriteError = { message?: string; code?: string };

export function moderationError(error: WriteError) {
  const message = error.message ?? "";
  if (message.includes("Approve the review, or reject it to delete it.")) {
    return message;
  }
  if (error.code === "42501" || /row-level security|permission denied/i.test(message)) {
    return "Admin access is required.";
  }
  return "Couldn't update that review.";
}

export async function listPendingReviews(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, therapist_id, author_name, anonymous, stars_cat_1, stars_cat_2, stars_cat_3, body, created_at, status",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []) as PendingRow[];
  const therapistIds = [...new Set(rows.map((row) => row.therapist_id))];
  const names = new Map<string, string>();

  if (therapistIds.length > 0) {
    const profiles = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", therapistIds);
    if (profiles.error) throw profiles.error;
    for (const profile of profiles.data ?? []) {
      if (profile.name) names.set(profile.id, profile.name);
    }
  }

  return rows.map((row) => toPendingReview(row, names.get(row.therapist_id)));
}

export async function approveReview(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from("reviews")
    .update({ status: "approved" })
    .eq("id", id)
    .eq("status", "pending")
    .select("id, status");

  if (error) throw new Error(moderationError(error));
  if (!data?.some((row) => row.status === "approved")) {
    throw new Error("That review is no longer pending.");
  }
}

export async function rejectReview(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", id)
    .eq("status", "pending")
    .select("id");

  if (error) throw new Error(moderationError(error));
  if (!data?.length) throw new Error("That review is no longer pending.");
}
