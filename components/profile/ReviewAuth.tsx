"use client";

import { FormEvent, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { textLinkClass } from "@/components/ui/styles";
import { useAuthQuery } from "@/components/auth/AuthQuery";
import { authPost, SIGNUP_CONFIRM_MESSAGE } from "@/lib/auth/auth-query";
import { forgotPasswordPath } from "@/lib/auth/password-reset";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";

export function ReviewAuth({ returnTo }: { returnTo?: string }) {
  const router = useRouter();
  const flash = useAuthQuery();
  const back = returnTo || routes.find;
  const [mode, setMode] = useState<"signup" | "signin">("signin");
  const [email, setEmail] = useState(flash.email);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(
    flash.error || (flash.sent === "confirm" ? SIGNUP_CONFIRM_MESSAGE : ""),
  );
  const [messageRole, setMessageRole] = useState<"alert" | "status">(
    flash.error ? "alert" : "status",
  );
  const [submitting, setSubmitting] = useState(false);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
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
        setMessageRole("alert");
        setMessage(result.error.message);
        return;
      }

      if (result.data.session) {
        router.refresh();
        return;
      }

      if (mode === "signup" && result.data.user) {
        setMessageRole("status");
        setMessage(SIGNUP_CONFIRM_MESSAGE);
      }
    } catch (error) {
      setMessageRole("alert");
      setMessage(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card as="div" className="px-5 py-6 sm:px-6">
      <p className="text-center text-mute">Sign in as a client to leave a review.</p>

      <div className="mt-5 flex justify-center">
        <SegmentedControl
          label="Create an account or sign in"
          value={mode}
          onChange={(option) => {
            setMode(option);
            setMessage("");
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
        onSubmit={submitAuth}
        className="mt-6 space-y-5"
      >
        <input type="hidden" name="scope" value="review" />
        <input type="hidden" name="next" value={back} />
        <input type="hidden" name="back" value={back} />
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
        />
        {mode === "signin" ? (
          <p className="text-center">
            <Link
              href={forgotPasswordPath("review", returnTo)}
              className={textLinkClass}
            >
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
                ? "Create account"
                : "Sign in"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function FormMessage({ children }: { children: ReactNode }) {
  return (
    <p
      aria-live="polite"
      className="mt-3 rounded-2xl bg-cream px-4 py-3 text-sm text-body"
    >
      {children}
    </p>
  );
}
