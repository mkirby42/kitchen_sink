"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { AccountShell } from "@/components/auth/AccountShell";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { textLinkClass } from "@/components/ui/styles";
import { forgotPasswordPath } from "@/lib/auth/password-reset";
import { createClient } from "@/lib/supabase/client";

const ALREADY_HAS_ACCOUNT = /already|registered|exists/i;
const SIGN_IN_HINT = "Switch to Sign in if you already have an account.";

/** Keep Supabase's already-registered copy and point the person at Sign in. */
export function joinAuthErrorCopy(message: string): string {
  const text = message.trim() || "Unable to authenticate.";
  if (!ALREADY_HAS_ACCOUNT.test(text) || /switch to sign in/i.test(text)) return text;
  const spaced = /[.!?]$/.test(text) ? text : `${text}.`;
  return `${spaced} ${SIGN_IN_HINT}`;
}

export function JoinAuth({
  initialMode = "signup",
}: {
  initialMode?: "signup" | "signin";
}) {
  const [mode, setMode] = useState<"signup" | "signin">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageRole, setMessageRole] = useState<"alert" | "status">("status");
  const [submitting, setSubmitting] = useState(false);

  function showMessage(text: string, role: "alert" | "status") {
    setMessage(text);
    setMessageRole(role);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);

    try {
      const supabase = createClient();
      const result =
        mode === "signup"
          ? await supabase.auth.signUp({ email, password })
          : await supabase.auth.signInWithPassword({ email, password });

      if (result.error) {
        showMessage(joinAuthErrorCopy(result.error.message), "alert");
        return;
      }

      if (result.data.session) {
        // Full navigation so the session cookie is on the next document request.
        // router.refresh() can race that cookie and paint an empty form.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- session cookie must land before the next render
        window.location.assign("/join");
        return;
      }

      if (mode === "signup" && result.data.user) {
        showMessage("Check your email to confirm, then sign in.", "status");
      }
    } catch (error) {
      showMessage(
        joinAuthErrorCopy(error instanceof Error ? error.message : "Unable to authenticate."),
        "alert",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AccountShell
      eyebrow="Join as a therapist"
      title={
        <>
          Welcome to <em className="text-clay">Kitchen Sink</em>.
        </>
      }
      lede={
        mode === "signup"
          ? "Create an account to build your therapist profile."
          : "Sign in to continue your therapist profile."
      }
    >
      <div className="flex justify-center">
        <SegmentedControl
          label="Create an account or sign in"
          value={mode}
          onChange={(option) => {
            setMode(option);
            setMessage("");
            setMessageRole("status");
          }}
          options={[
            { value: "signup", label: "Sign up" },
            { value: "signin", label: "Sign in" },
          ]}
        />
      </div>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <TextField
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <TextField
          label="Password"
          type="password"
          required
          minLength={6}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          hint="At least 6 characters."
        />

        {mode === "signin" ? (
          <p className="text-center">
            <Link href={forgotPasswordPath("join")} className={textLinkClass}>
              Forgot password?
            </Link>
          </p>
        ) : null}

        {message ? <Notice role={messageRole}>{message}</Notice> : null}

        <div className="flex justify-center pt-2">
          <Button type="submit" disabled={submitting}>
            {submitting
              ? "Please wait…"
              : mode === "signup"
                ? "Create account →"
                : "Sign in →"}
          </Button>
        </div>
      </form>
    </AccountShell>
  );
}
