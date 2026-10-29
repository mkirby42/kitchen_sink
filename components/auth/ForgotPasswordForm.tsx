"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { AccountShell } from "@/components/auth/AccountShell";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { textLinkClass } from "@/components/ui/styles";
import { authPost } from "@/lib/auth/auth-query";
import {
  passwordResetRedirect,
  rememberResetReturn,
  RESET_SEND_FAILED_MESSAGE,
  RESET_SENT_MESSAGE,
  resetContinuePath,
  resetRequestMessage,
  resetSignInPath,
  safeAppPath,
} from "@/lib/auth/password-reset";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm({
  from,
  returnTo,
  initialEmail = "",
  initialError = "",
  initialSent = false,
}: {
  from?: string;
  returnTo?: string;
  initialEmail?: string;
  initialError?: string;
  initialSent?: boolean;
}) {
  const continuePath = resetContinuePath(from, returnTo);
  const signInPath = resetSignInPath(from, returnTo);
  const [email, setEmail] = useState(initialEmail);
  const [message, setMessage] = useState(initialError);
  const [sent, setSent] = useState(initialSent);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: passwordResetRedirect(window.location.origin),
      });
      const result = resetRequestMessage(error);
      if (result.ok) {
        rememberResetReturn(continuePath);
        setSent(true);
        return;
      }
      setMessage(result.message);
    } catch (error) {
      setMessage(
        error instanceof Error && /missing next_public_supabase/i.test(error.message)
          ? "Auth isn't configured yet."
          : RESET_SEND_FAILED_MESSAGE,
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AccountShell
      eyebrow="Account"
      title={sent ? "Check your email" : "Forgot your password?"}
      lede={
        sent
          ? RESET_SENT_MESSAGE
          : "Enter the email on your account. We'll send a link to choose a new password."
      }
    >
      {sent ? (
        <div className="flex justify-center">
          <Button href={signInPath}>Back to sign in</Button>
        </div>
      ) : (
        <>
          <form
            method="post"
            action={authPost.forgotPassword}
            onSubmit={submit}
            className="space-y-5"
          >
            {from ? <input type="hidden" name="from" value={from} /> : null}
            {safeAppPath(returnTo) ? (
              <input type="hidden" name="return" value={safeAppPath(returnTo) ?? ""} />
            ) : null}
            <TextField
              label="Email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            {message ? <Notice role="alert">{message}</Notice> : null}

            <div className="flex justify-center pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Please wait…" : "Send reset link"}
              </Button>
            </div>
          </form>
          <p className="mt-6 text-center">
            <Link href={signInPath} className={textLinkClass}>
              Back to sign in
            </Link>
          </p>
        </>
      )}
    </AccountShell>
  );
}
