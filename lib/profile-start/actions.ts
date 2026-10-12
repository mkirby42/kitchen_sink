"use server";

import { randomBytes } from "node:crypto";
import { after } from "next/server";
import { adminToolsVisible } from "@/lib/audience";
import { readAudienceCookie } from "@/lib/audience-cookie";
import { notifyProfileStartAdmin, sendProfileStartReadyEmail } from "@/lib/profile-start/notify";
import { isUuid, parseProfileStart } from "@/lib/profile-start/validate";
import { createClient } from "@/lib/supabase/server";
import {
  SERVICE_ROLE_MISSING,
  createServiceRoleClient,
} from "@/lib/supabase/service";

export type ProfileStartActionResult =
  | { ok: true; profileId?: string }
  | { ok: false; message: string };

const SAVED =
  "We'll email you when your draft is ready to review. Nothing goes live until you approve it.";

export async function submitProfileStart(input: {
  name: string;
  email: string;
  links: string[];
  company?: string;
}): Promise<ProfileStartActionResult & { confirmation?: string }> {
  const parsed = parseProfileStart(input);
  if (!parsed.ok) return parsed;
  if (parsed.honeypot) return { ok: true, confirmation: SAVED };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("submit_profile_start", {
      p_name: parsed.name,
      p_email: parsed.email,
      p_links: parsed.links,
    });
    if (error) return { ok: false, message: publicError(error.message) };
    if (typeof data !== "string" || !isUuid(data)) {
      return { ok: false, message: "We couldn't save that. Try again." };
    }

    const requestId = data;
    try {
      after(() => notifyProfileStartAdmin(requestId));
    } catch (scheduleError) {
      console.error("Profile start email was not scheduled", scheduleError);
    }

    return { ok: true, confirmation: SAVED };
  } catch (error) {
    console.error("submit_profile_start", error);
    return { ok: false, message: "We couldn't save that. Try again." };
  }
}

export async function beginProfileDraft(
  requestId: string,
): Promise<ProfileStartActionResult> {
  if (!isUuid(requestId)) return { ok: false, message: "That request was not found." };

  const gate = await requireAdmin();
  if (gate.error) return { ok: false, message: gate.error };

  const { data: request, error } = await gate.supabase
    .from("profile_starts")
    .select("id, email, profile_id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (error || !request) return { ok: false, message: "That request was not found." };
  if (request.status === "published") {
    return { ok: false, message: "That draft is already published." };
  }
  if (typeof request.profile_id === "string") {
    return { ok: true, profileId: request.profile_id };
  }

  const email = String(request.email ?? "");
  const { data: existingId, error: lookupError } = await gate.supabase.rpc(
    "admin_auth_user_id_by_email",
    { p_email: email },
  );
  if (lookupError) return { ok: false, message: publicError(lookupError.message) };

  let userId = typeof existingId === "string" ? existingId : null;
  if (!userId) {
    const admin = createServiceRoleClient();
    if (!admin) return { ok: false, message: SERVICE_ROLE_MISSING };
    const created = await admin.auth.admin.createUser({
      email,
      password: randomBytes(24).toString("base64url"),
      email_confirm: true,
    });
    userId = created.data.user?.id ?? null;
    if (!userId) {
      const again = await gate.supabase.rpc("admin_auth_user_id_by_email", {
        p_email: email,
      });
      userId = typeof again.data === "string" ? again.data : null;
      if (!userId) {
        return {
          ok: false,
          message: publicError(
            created.error?.message ?? "",
            "We couldn't create the therapist login.",
          ),
        };
      }
    }
  }

  const attached = await gate.supabase.rpc("admin_attach_started_profile", {
    p_request_id: requestId,
    p_user_id: userId,
  });
  if (attached.error) return { ok: false, message: publicError(attached.error.message) };
  const profileId = typeof attached.data === "string" ? attached.data : userId;
  return { ok: true, profileId };
}

export async function sendDraftReadyEmail(
  requestId: string,
): Promise<ProfileStartActionResult> {
  if (!isUuid(requestId)) return { ok: false, message: "That request was not found." };

  const gate = await requireAdmin();
  if (gate.error) return { ok: false, message: gate.error };

  const { data: request, error } = await gate.supabase
    .from("profile_starts")
    .select("id, name, email, profile_id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (error || !request) return { ok: false, message: "That request was not found." };
  if (!request.profile_id) {
    return { ok: false, message: "Start the draft before emailing the therapist." };
  }
  if (request.status === "published") {
    return { ok: false, message: "That draft is already published." };
  }

  const sent = await sendProfileStartReadyEmail({
    id: request.id,
    name: String(request.name ?? ""),
    email: String(request.email ?? ""),
  });
  if (!sent.ok) {
    if (sent.message === "missing-service-role") {
      return { ok: false, message: SERVICE_ROLE_MISSING };
    }
    return {
      ok: false,
      message: "We couldn't send that email. Check the mail setup and try again.",
    };
  }

  const marked = await gate.supabase.rpc("admin_mark_profile_start_ready", {
    p_id: requestId,
  });
  if (marked.error) return { ok: false, message: publicError(marked.error.message) };
  return { ok: true };
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, error: "Sign in as an admin." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !adminToolsVisible({
      role: profile?.role,
      audience: await readAudienceCookie(),
    })
  ) {
    return { supabase, error: "Switch to Admin view to do that." };
  }

  return { supabase, error: null };
}

function publicError(message: string, fallback = "Something went wrong. Try again.") {
  const text = message.replace(/\s+/g, " ").trim();
  if (!text || text.length > 180) return fallback;
  if (/jwt|token|bearer|stack|password|service_role|key/i.test(text)) return fallback;
  return text;
}
