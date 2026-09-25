"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { JoinShell } from "@/components/join/JoinShell";
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

const inputClass =
  "mt-2 w-full border-0 border-b border-line bg-transparent px-0 py-3 text-lg outline-none focus:border-clay";

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
        <p className="text-xs font-semibold tracking-[0.2em] text-clay uppercase">
          Account
        </p>
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
            <Link
              href={routes.forgotPassword}
              className="mt-8 inline-flex rounded-full bg-clay px-6 py-3 font-semibold text-paper hover:bg-clay-dark"
            >
              Request a new link
            </Link>
          </>
        ) : null}

        {phase === "done" ? (
          <>
            <p className="mt-4 text-mute">{PASSWORD_UPDATED_MESSAGE}</p>
            <Link
              href={continueHref}
              className="mt-8 inline-flex rounded-full bg-clay px-6 py-3 font-semibold text-paper hover:bg-clay-dark"
            >
              Continue
            </Link>
          </>
        ) : null}

        {phase === "ready" ? (
          <form onSubmit={submit} className="mt-8 space-y-7">
            <p className="text-mute">At least {PASSWORD_MIN_LENGTH} characters.</p>
            <label className="block">
              <span className="text-xs font-semibold tracking-[0.16em] text-mute uppercase">
                New password
              </span>
              <input
                type="password"
                required
                minLength={PASSWORD_MIN_LENGTH}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold tracking-[0.16em] text-mute uppercase">
                Confirm password
              </span>
              <input
                type="password"
                required
                minLength={PASSWORD_MIN_LENGTH}
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
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
              {submitting ? "Please wait…" : "Update password"}
            </button>
          </form>
        ) : null}
      </div>
    </JoinShell>
  );
}
