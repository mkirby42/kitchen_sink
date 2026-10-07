"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { TextField } from "@/components/ui/Field";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { forgotPasswordPath } from "@/lib/auth/password-reset";
import { createClient } from "@/lib/supabase/client";
import { JoinShell } from "./JoinShell";

export function JoinAuth({
  initialMode = "signup",
}: {
  initialMode?: "signup" | "signin";
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"signup" | "signin">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
        setMessage(result.error.message);
        return;
      }

      if (result.data.session) {
        router.refresh();
        return;
      }

      if (mode === "signup" && result.data.user) {
        setMessage("Check your email to confirm, then sign in.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to authenticate.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <JoinShell>
      <div className="mx-auto max-w-xl">
        <Eyebrow>Join as a therapist</Eyebrow>
        <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
          Welcome to <em className="text-clay">Kitchen Sink</em>.
        </h1>
        <p className="mt-4 text-mute">
          {mode === "signup"
            ? "Create an account to build your therapist profile."
            : "Sign in to continue your therapist profile."}
        </p>

        <div className="mt-8">
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

        <form onSubmit={submit} className="mt-8 space-y-7">
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
            <p className="-mt-4">
              <Link
                href={forgotPasswordPath("join")}
                className="text-sm font-semibold text-clay hover:text-clay-dark"
              >
                Forgot password?
              </Link>
            </p>
          ) : null}

          {message ? (
            <p aria-live="polite" className="rounded-2xl bg-cream px-4 py-3 text-sm text-clay-dark">
              {message}
            </p>
          ) : null}

          <Button type="submit" disabled={submitting}>
            {submitting
              ? "Please wait…"
              : mode === "signup"
                ? "Create account →"
                : "Sign in →"}
          </Button>
        </form>
      </div>
    </JoinShell>
  );
}
