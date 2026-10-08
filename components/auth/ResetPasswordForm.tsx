"use client";

import { FormEvent, useEffect, useState } from "react";
import { AccountShell } from "@/components/auth/AccountShell";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_UPDATED_MESSAGE,
  RESET_LINK_BROWSER_MESSAGE,
  RESET_LINK_INVALID_MESSAGE,
  passwordChangeError,
  passwordUpdateMessage,
  readResetLink,
  readResetReturn,
  resetLinkAction,
  type ResetLinkParams,
} from "@/lib/auth/password-reset";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { supabasePublicConfig } from "@/lib/supabase/env";

type ResetPhase = "checking" | "ready" | "invalid" | "wrong-browser" | "unconfigured" | "done";

let inflight: Promise<ResetPhase> | null = null;

function loadResetPhase(): Promise<ResetPhase> {
  if (typeof window === "undefined") return Promise.resolve("checking");

  const { params, cleanPath } = readResetLink(window.location.href);
  if (params) {
    if (!inflight) {
      window.history.replaceState({}, "", cleanPath);
      inflight = settleResetLink(params).finally(() => {
        inflight = null;
      });
    }
    return inflight;
  }

  if (inflight) return inflight;
  inflight = settleResetLink(null).finally(() => {
    inflight = null;
  });
  return inflight;
}

async function settleResetLink(params: ResetLinkParams | null): Promise<ResetPhase> {
  if (!supabasePublicConfig()) return "unconfigured";

  try {
    const supabase = createClient();
    const action = resetLinkAction(params);

    if (action === "invalid") return "invalid";

    if (action === "otp" && params?.tokenHash) {
      const { error } = await supabase.auth.verifyOtp({
        type: "recovery",
        token_hash: params.tokenHash,
      });
      if (!error) return "ready";
      const { data } = await supabase.auth.getUser();
      return data.user ? "ready" : "invalid";
    }

    if (action === "code" && params?.code) {
      const { error } = await supabase.auth.exchangeCodeForSession(params.code);
      if (!error) return "ready";
      const { data } = await supabase.auth.getUser();
      if (data.user) return "ready";
      if (/code verifier|pkce/i.test(error.message)) return "wrong-browser";
      return "invalid";
    }

    if (action === "session" && params?.accessToken && params.refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: params.accessToken,
        refresh_token: params.refreshToken,
      });
      return error ? "invalid" : "ready";
    }

    const { data } = await supabase.auth.getUser();
    return data.user ? "ready" : "invalid";
  } catch {
    return "invalid";
  }
}

export function ResetPasswordForm() {
  const [phase, setPhase] = useState<ResetPhase>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [continueHref, setContinueHref] = useState<string>(routes.home);

  useEffect(() => {
    let cancelled = false;
    void loadResetPhase().then((next) => {
      if (!cancelled) setPhase(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const local = passwordChangeError(password, confirm);
    if (local) {
      setMessage(local);
      return;
    }

    setMessage("");
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMessage(passwordUpdateMessage(error));
        return;
      }
      setContinueHref(readResetReturn(routes.home));
      setPhase("done");
    } catch {
      setMessage("We couldn't update that password. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const problem =
    phase === "invalid"
      ? RESET_LINK_INVALID_MESSAGE
      : phase === "wrong-browser"
        ? RESET_LINK_BROWSER_MESSAGE
        : phase === "unconfigured"
          ? "Auth isn't configured yet."
          : null;

  const lede = problem
    ? problem
    : phase === "done"
      ? PASSWORD_UPDATED_MESSAGE
      : phase === "checking"
        ? "Checking your reset link…"
        : `At least ${PASSWORD_MIN_LENGTH} characters.`;

  return (
    <AccountShell
      eyebrow="Account"
      title={
        phase === "done"
          ? "Password updated"
          : problem
            ? "Reset link"
            : "Choose a new password"
      }
      lede={problem ? <p role="alert">{lede}</p> : lede}
    >
      {problem ? (
        <div className="flex justify-center">
          <Button href={routes.forgotPassword}>Request a new link</Button>
        </div>
      ) : null}

      {phase === "done" ? (
        <div className="flex justify-center">
          <Button href={continueHref}>Continue</Button>
        </div>
      ) : null}

      {phase === "ready" ? (
        <form onSubmit={submit} className="space-y-5">
          <TextField
            label="New password"
            type="password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <TextField
            label="Confirm password"
            type="password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
          {message ? <Notice role="alert">{message}</Notice> : null}
          <div className="flex justify-center pt-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Please wait…" : "Update password"}
            </Button>
          </div>
        </form>
      ) : null}
    </AccountShell>
  );
}
