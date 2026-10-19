import { feedbackFromAddress, sendFeedbackEmail } from "@/lib/feedback/email";
import { buildRefreshEmail } from "@/lib/referrals/email";
import { routes } from "@/lib/routes";
import { deploymentOrigin } from "@/lib/site";
import { createServiceRoleClient } from "@/lib/supabase/service";

type ClaimRow = {
  post_id: string;
  poster_email: string | null;
  age_range: string;
  refresh_token: string;
  closes_at: string;
};

/** Email posters whose week ended. Safe to call on a page load; claims each row once. */
export async function sweepReferralRefreshEmails() {
  const admin = createServiceRoleClient();
  if (!admin) return;

  try {
    const { data, error } = await admin.rpc("claim_referral_refresh_prompts");
    if (error) {
      console.error("claim_referral_refresh_prompts", error.message);
      return;
    }
    const rows = (Array.isArray(data) ? data : []) as ClaimRow[];
    if (rows.length === 0) return;

    const origin = await deploymentOrigin();
    const from = feedbackFromAddress();
    for (const row of rows) {
      const email = row.poster_email?.trim() ?? "";
      if (!email) {
        console.error("Referral refresh email skipped; profile has no email", row.post_id);
        continue;
      }
      const message = buildRefreshEmail({
        ageRange: row.age_range,
        refreshUrl: `${origin}${routes.referralMine}?refresh=${row.refresh_token}`,
        mineUrl: `${origin}${routes.referralMine}`,
      });
      try {
        await sendFeedbackEmail(
          {
            subject: message.subject,
            text: message.text,
            to: email,
            replyTo: null,
            idempotencyKey: `referral-refresh:${row.post_id}:${row.closes_at}`,
          },
          { from },
        );
      } catch (sendError) {
        console.error("Referral refresh email send failed", sendError);
        const { error: releaseError } = await admin.rpc(
          "release_referral_refresh_prompt",
          { p_id: row.post_id },
        );
        if (releaseError) {
          console.error("release_referral_refresh_prompt", releaseError.message);
        }
      }
    }
  } catch (error) {
    console.error("Referral refresh sweep failed", error);
  }
}
