import {
  buildFeedbackEmail,
  feedbackFromAddress,
  sendFeedbackEmail,
} from "@/lib/feedback/email";
import { deploymentOrigin } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

const FRESH_MS = 24 * 60 * 60 * 1000;

type ClaimRow = {
  feedback_id: string;
  feedback_body: string;
  feedback_created_at: string;
};

/**
 * Claim the saved note and email Christine. Logs failures.
 * A failed send clears the claim so `notified_at` stays null.
 */
export async function notifyProductFeedback(submittedBody: string) {
  const body = submittedBody.trim();
  if (!body) return;
  try {
    await deliver(body);
  } catch (error) {
    console.error("Feedback email failed", error);
  }
}

async function deliver(body: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.error("Feedback email skipped; no signed-in user");
    return;
  }

  const { data, error } = await supabase.rpc("claim_own_feedback_for_email", {
    p_body: body,
  });
  if (error) {
    console.error("claim_own_feedback_for_email", error.message);
    return;
  }

  const row = firstClaim(data);
  if (!row) {
    if (await alreadyEmailed(supabase, body)) return;
    console.error("No fresh feedback row to email");
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email")
    .eq("id", user.id)
    .maybeSingle();

  const origin = await deploymentOrigin();
  const message = buildFeedbackEmail({
    body: row.feedback_body,
    createdAt: row.feedback_created_at,
    page: `${origin}/join`,
    profileId: user.id,
    feedbackId: row.feedback_id,
    name: profile?.name ?? null,
    profileEmail: profile?.email ?? null,
    loginEmail: user.email ?? null,
  });

  try {
    await sendFeedbackEmail(message, {
      from: feedbackFromAddress(),
      maxAttempts: 3,
    });
  } catch (sendError) {
    console.error("Feedback email send failed", sendError);
    const { error: releaseError } = await supabase.rpc(
      "release_own_feedback_email_claim",
      { p_id: row.feedback_id },
    );
    if (releaseError) {
      console.error("release_own_feedback_email_claim", releaseError.message);
    }
  }
}

async function alreadyEmailed(
  supabase: Awaited<ReturnType<typeof createClient>>,
  body: string,
) {
  const { data, error } = await supabase
    .from("feedback")
    .select("body, notified_at, created_at")
    .order("created_at", { ascending: false })
    .limit(5);
  if (error || !data) return false;
  const cutoff = Date.now() - FRESH_MS;
  return data.some((row) => {
    if (!row.notified_at || row.body.trim() !== body) return false;
    const created = new Date(row.created_at).getTime();
    return Number.isFinite(created) && created >= cutoff;
  });
}

function firstClaim(data: unknown): ClaimRow | null {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") return null;
  const candidate = row as Partial<ClaimRow>;
  if (
    typeof candidate.feedback_id !== "string" ||
    typeof candidate.feedback_body !== "string" ||
    typeof candidate.feedback_created_at !== "string"
  ) {
    return null;
  }
  return {
    feedback_id: candidate.feedback_id,
    feedback_body: candidate.feedback_body,
    feedback_created_at: candidate.feedback_created_at,
  };
}
