import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountShell } from "@/components/auth/AccountShell";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { sanitizeAuthError } from "@/lib/auth/auth-query";
import {
  classifyResetVisit,
  resetCallbackPath,
  type ResetSearch,
} from "@/lib/auth/password-reset";
import { supabasePublicConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<ResetSearch>;
}) {
  const params = await searchParams;
  if (!supabasePublicConfig()) {
    return (
      <AccountShell
        eyebrow="Account"
        title="Choose a new password"
        lede="Auth isn't configured yet."
      />
    );
  }

  const visit = classifyResetVisit(params);
  if (visit.kind === "exchange") {
    redirect(resetCallbackPath(visit));
  }
  if (visit.kind === "problem") {
    return (
      <ResetPasswordForm
        initialPhase={visit.problem === "browser" ? "wrong-browser" : "invalid"}
      />
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return <ResetPasswordForm initialPhase="invalid" />;
  }

  return (
    <ResetPasswordForm
      initialPhase="ready"
      initialError={visit.error ? sanitizeAuthError(visit.error) : ""}
      from={visit.from}
      returnTo={visit.returnTo}
    />
  );
}
