"use client";

import { FormEvent, useEffect, useState } from "react";
import { JoinShell } from "@/components/join/JoinShell";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { TextField } from "@/components/ui/Field";
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

  return (
    <JoinShell>
      <div>
        <Eyebrow>Account</Eyebrow>
        <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
          {phase === "done"
            ? "Password updated"
            : problem
              ? "Reset link"
              : "Choose a new password"}
        </h1>

        {phase === "checking" ? (
          <p className="mt-4 text-mute">Checking your reset link…</p>
        ) : null}

        {problem ? (
          <>
            <p role="alert" className="mt-4 text-mute">
              {problem}
            </p>
            <Button href={routes.forgotPassword} className="mt-8">
              Request a new link
            </Button>
          </>
        ) : null}

        {phase === "done" ? (
          <>
            <p className="mt-4 text-mute">{PASSWORD_UPDATED_MESSAGE}</p>
            <Button href={continueHref} className="mt-8">
              Continue
            </Button>
          </>
        ) : null}

        {phase === "ready" ? (
          <form onSubmit={submit} className="mt-8 space-y-7">
            <p className="text-mute">At least {PASSWORD_MIN_LENGTH} characters.</p>
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
            {message ? (
              <p
                role="alert"
                className="rounded-2xl bg-cream px-4 py-3 text-sm text-clay-dark"
              >
                {message}
              </p>
            ) : null}
            <Button type="submit" disabled={submitting}>
              {submitting ? "Please wait…" : "Update password"}
            </Button>
          </form>
        ) : null}
      </div>
    </JoinShell>
  );
}
