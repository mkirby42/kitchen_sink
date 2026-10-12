import {
  feedbackFromAddress,
  sendFeedbackEmail,
} from "@/lib/feedback/email";
import {
  buildProfileStartAdminEmail,
  buildProfileStartReadyEmail,
} from "@/lib/profile-start/email";
import { routes } from "@/lib/routes";
import { deploymentOrigin } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { passwordResetRedirect } from "@/lib/auth/password-reset";

type ClaimRow = {
  request_id: string;
  request_name: string;
  request_email: string;
  request_links: string[];
  request_created_at: string;
};

export async function notifyProfileStartAdmin(id: string) {
  try {
    await deliverAdmin(id);
  } catch (error) {
    console.error("Profile start admin email failed", error);
  }
}

async function deliverAdmin(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("claim_profile_start_admin_email", {
    p_id: id,
  });
  if (error) {
    console.error("claim_profile_start_admin_email", error.message);
    return;
  }

  const row = firstClaim(data);
  if (!row) return;

  const origin = await deploymentOrigin();
  const message = buildProfileStartAdminEmail({
    id: row.request_id,
    name: row.request_name,
    email: row.request_email,
    links: row.request_links,
    createdAt: row.request_created_at,
    queueUrl: `${origin}${routes.adminStarts}`,
  });

  try {
    await sendFeedbackEmail(message, { from: feedbackFromAddress() });
  } catch (sendError) {
    console.error("Profile start admin email send failed", sendError);
    const { error: releaseError } = await supabase.rpc(
      "release_profile_start_admin_email",
      { p_id: row.request_id },
    );
    if (releaseError) {
      console.error("release_profile_start_admin_email", releaseError.message);
    }
  }
}

export async function sendProfileStartReadyEmail(input: {
  id: string;
  name: string;
  email: string;
}) {
  const admin = createServiceRoleClient();
  if (!admin) return { ok: false as const, message: "missing-service-role" };

  const origin = await deploymentOrigin();
  const linked = await admin.auth.admin.generateLink({
    type: "recovery",
    email: input.email,
    options: { redirectTo: passwordResetRedirect(origin) },
  });
  const actionLink = linked.data?.properties?.action_link ?? "";
  if (linked.error || !isLoginLink(actionLink)) {
    console.error("Profile start login link failed", linked.error?.message);
    return { ok: false as const, message: "link-failed" };
  }

  const message = buildProfileStartReadyEmail({
    id: input.id,
    name: input.name,
    email: input.email,
    actionLink,
    signInUrl: `${origin}${routes.joinSignIn}`,
    nonce: new Date().toISOString(),
  });

  try {
    await sendFeedbackEmail(message, { from: feedbackFromAddress() });
  } catch (error) {
    console.error("Profile start ready email failed", error);
    return { ok: false as const, message: "send-failed" };
  }

  return { ok: true as const };
}

function isLoginLink(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol === "https:") return true;
    return (
      url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1")
    );
  } catch {
    return false;
  }
}

function firstClaim(data: unknown): ClaimRow | null {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") return null;
  const candidate = row as Partial<ClaimRow>;
  if (
    typeof candidate.request_id !== "string" ||
    typeof candidate.request_name !== "string" ||
    typeof candidate.request_email !== "string" ||
    typeof candidate.request_created_at !== "string" ||
    !Array.isArray(candidate.request_links)
  ) {
    return null;
  }
  return {
    request_id: candidate.request_id,
    request_name: candidate.request_name,
    request_email: candidate.request_email,
    request_links: candidate.request_links.filter(
      (link): link is string => typeof link === "string",
    ),
    request_created_at: candidate.request_created_at,
  };
}
