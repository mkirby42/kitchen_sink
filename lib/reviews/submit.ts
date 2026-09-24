import type { SupabaseClient } from "@supabase/supabase-js";
import { ensurePatientProfile } from "./patient";
import { validateReview, type ReviewDraft } from "./validate";

const KNOWN_ERRORS = [
  "Add a display name, or post anonymously.",
  "Write a short review.",
  "Keep the review under 2000 characters.",
  "Display name must be 80 characters or fewer.",
  "Rate all three questions from 1 to 5.",
  "Rating must be a whole number from 1 to 5.",
  "Sign in as a client to leave a review.",
  "You cannot review your own profile.",
  "This therapist is not open to new clients.",
];

type WriteError = { message?: string; code?: string };

export function reviewWriteError(error: WriteError) {
  const message = error.message ?? "";
  const known = KNOWN_ERRORS.find((line) => message.includes(line));
  if (known) return known;
  if (error.code === "42501" || /row-level security|permission denied/i.test(message)) {
    return "Sign in as a client to leave a review.";
  }
  if (/therapist/i.test(message)) {
    return "Sign in as a client to leave a review.";
  }
  return "Couldn't post that review.";
}

function messageOf(error: unknown) {
  if (error instanceof Error) return error.message;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "";
}

export async function submitReview(
  supabase: SupabaseClient,
  therapistId: string,
  draft: ReviewDraft,
) {
  const validated = validateReview(draft);
  if (!validated.ok) throw new Error(validated.error);

  let patientId: string;
  try {
    patientId = await ensurePatientProfile(supabase);
  } catch (error) {
    throw new Error(reviewWriteError({ message: messageOf(error) }));
  }

  const payload = {
    therapist_id: therapistId,
    patient_id: patientId,
    author_name: validated.value.authorName,
    anonymous: validated.value.anonymous,
    stars_cat_1: validated.value.ratings.understood,
    stars_cat_2: validated.value.ratings.communication,
    stars_cat_3: validated.value.ratings.fit,
    body: validated.value.body,
  };

  const inserted = await supabase.from("reviews").insert(payload);
  if (!inserted.error) return;

  if (inserted.error.code !== "23505") {
    throw new Error(reviewWriteError(inserted.error));
  }

  const updated = await supabase
    .from("reviews")
    .update({
      author_name: payload.author_name,
      anonymous: payload.anonymous,
      stars_cat_1: payload.stars_cat_1,
      stars_cat_2: payload.stars_cat_2,
      stars_cat_3: payload.stars_cat_3,
      body: payload.body,
    })
    .eq("therapist_id", therapistId)
    .eq("patient_id", patientId);

  if (updated.error) throw new Error(reviewWriteError(updated.error));
}

export async function deleteOwnReview(
  supabase: SupabaseClient,
  therapistId: string,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in as a client to leave a review.");

  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("therapist_id", therapistId)
    .eq("patient_id", user.id);

  if (error) throw new Error(reviewWriteError(error));
}
