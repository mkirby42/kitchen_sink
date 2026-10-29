"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { AccountShell } from "@/components/auth/AccountShell";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { textLinkClass } from "@/components/ui/styles";
import {
  authPost,
  joinAuthErrorCopy,
  SIGNUP_CONFIRM_MESSAGE,
} from "@/lib/auth/auth-query";
import { forgotPasswordPath } from "@/lib/auth/password-reset";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";

export { joinAuthErrorCopy };

export function JoinAuth({
  initialMode = "signup",
  initialEmail = "",
  initialError = "",
  initialSent = "",
}: {
  initialMode?: "signup" | "signin";
  initialEmail?: string;
  initialError?: string;
  initialSent?: "" | "1" | "confirm";
}) {
  const [mode, setMode] = useState<"signup" | "signin">(initialMode);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(
    initialError || (initialSent === "confirm" ? SIGNUP_CONFIRM_MESSAGE : ""),
  );
  const [messageRole, setMessageRole] = useState<"alert" | "status">(
    initialError ? "alert" : "status",
  );
  const [submitting, setSubmitting] = useState(false);

  function showMessage(text: string, role: "alert" | "status") {
    setMessage(text);
    setMessageRole(role);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
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
        setSubmitting(false);
        return;
      }

      if (result.data.session) {
        // Full navigation so the session cookie is on the next document request.
        // router.refresh() can race that cookie and paint an empty form (sign-up
        // and sign-in). Keep fields and "Please wait…" until the document leaves.
        showMessage(
          mode === "signin" ? "Signing you in…" : "Account created. Continuing…",
          "status",
        );
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- session cookie must land before the next render
        window.location.assign("/join");
        return;
      }

      if (mode === "signup" && result.data.user) {
        showMessage(SIGNUP_CONFIRM_MESSAGE, "status");
      }
      setSubmitting(false);
    } catch (error) {
      showMessage(
        joinAuthErrorCopy(error instanceof Error ? error.message : "Unable to authenticate."),
        "alert",
      );
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

      <form
        method="post"
        action={mode === "signup" ? authPost.signUp : authPost.signIn}
        onSubmit={(event) => void submit(event)}
        className="mt-8 space-y-5"
      >
        <input type="hidden" name="scope" value="join" />
        <input type="hidden" name="next" value={routes.join} />
        <input
          type="hidden"
          name="back"
          value={mode === "signup" ? routes.join : routes.joinSignIn}
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <TextField
          label="Password"
          name="password"
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
