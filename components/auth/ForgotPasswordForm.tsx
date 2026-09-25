"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { JoinShell } from "@/components/join/JoinShell";
import {
  passwordResetRedirect,
  rememberResetReturn,
  RESET_SEND_FAILED_MESSAGE,
  RESET_SENT_MESSAGE,
  resetContinuePath,
  resetRequestMessage,
  resetSignInPath,
} from "@/lib/auth/password-reset";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "mt-2 w-full border-0 border-b border-line bg-transparent px-0 py-3 text-lg outline-none focus:border-clay";

export function ForgotPasswordForm({
  from,
  returnTo,
}: {
  from?: string;
  returnTo?: string;
}) {
  const continuePath = resetContinuePath(from, returnTo);
  const signInPath = resetSignInPath(from, returnTo);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
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
    <JoinShell closeHref={signInPath}>
      <div>
        <p className="text-xs font-semibold tracking-[0.2em] text-clay uppercase">
          Account
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
          {sent ? "Check your email" : "Forgot your password?"}
        </h1>
        <p className="mt-4 text-mute">
          {sent
            ? RESET_SENT_MESSAGE
            : "Enter the email on your account. We'll send a link to choose a new password."}
        </p>

        {sent ? (
          <Link
            href={signInPath}
            className="mt-8 inline-flex rounded-full bg-clay px-6 py-3 font-semibold text-paper hover:bg-clay-dark"
          >
            Back to sign in
          </Link>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-7">
            <label className="block">
              <span className="text-xs font-semibold tracking-[0.16em] text-mute uppercase">
                Email
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
              />
            </label>

            {message ? (
              <p
                role="alert"
                className="rounded-2xl bg-cream px-4 py-3 text-sm text-clay-dark"
              >
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-clay px-6 py-3 font-semibold text-paper hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Please wait…" : "Send reset link"}
            </button>
          </form>
        )}

        {sent ? null : (
          <p className="mt-6 text-sm text-mute">
            <Link href={signInPath} className="font-semibold text-clay hover:text-clay-dark">
              Back to sign in
            </Link>
          </p>
        )}
      </div>
    </JoinShell>
  );
}
