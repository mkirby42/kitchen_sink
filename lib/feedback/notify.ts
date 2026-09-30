import {
  buildFeedbackEmail,
  feedbackFromAddress,
  sendFeedbackEmail,
} from "@/lib/feedback/email";
import { deploymentOrigin } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

const EMAIL_FAILED =
  "Your profile is saved, but the feedback email did not go out. Submit again to retry.";

const FRESH_MS = 24 * 60 * 60 * 1000;

type ClaimRow = {
  feedback_id: string;
  feedback_body: string;
  feedback_created_at: string;
};

export async function notifyProductFeedback(submittedBody: string) {
  const body = submittedBody.trim();
  if (!body) return { ok: true as const };
  return deliver(body, { maxAttempts: 3 });
}

/** Owner profile view: send a join note that is stored but not emailed yet. */
export async function notifyPendingProductFeedback() {
  try {
    return await deliver(null, { maxAttempts: 1 });
  } catch (error) {
    console.error("Pending feedback email failed", error);
    return { ok: false as const, error: EMAIL_FAILED };
  }
}

async function deliver(
  body: string | null,
  sendOptions: { maxAttempts: number },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return body === null
        ? { ok: true as const }
        : { ok: false as const, error: EMAIL_FAILED };
    }

    const { data, error } = await supabase.rpc("claim_own_feedback_for_email", {
      p_body: body,
    });
    if (error) {
      console.error("claim_own_feedback_for_email", error.message);
      return { ok: false as const, error: EMAIL_FAILED };
    }

    const row = firstClaim(data);
    if (!row) {
      if (body === null) return { ok: true as const };
      if (await alreadyEmailed(supabase, body)) return { ok: true as const };
      console.error("No fresh feedback row to email");
      return { ok: false as const, error: EMAIL_FAILED };
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
        maxAttempts: sendOptions.maxAttempts,
      });
    } catch (sendError) {
      console.error("Feedback email send failed", sendError);
      const { error: releaseError } = await supabase.rpc(
        "release_own_feedback_email_claim",
        { p_id: row.feedback_id },
      );
      if (releaseError) {
        console.error(
          "release_own_feedback_email_claim",
          releaseError.message,
        );
      }
      return { ok: false as const, error: EMAIL_FAILED };
    }

    return { ok: true as const };
  } catch (error) {
    console.error("Feedback email failed", error);
    return { ok: false as const, error: EMAIL_FAILED };
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
