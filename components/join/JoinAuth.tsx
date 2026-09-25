"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
        <p className="text-xs font-semibold tracking-[0.2em] text-clay uppercase">
          Join as a therapist
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
          Welcome to <em className="text-clay">Kitchen Sink</em>.
        </h1>
        <p className="mt-4 text-mute">
          {mode === "signup"
            ? "Create an account to build your therapist profile."
            : "Sign in to continue your therapist profile."}
        </p>

        <div className="mt-8 inline-flex rounded-full bg-cream p-1">
          {(["signup", "signin"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setMode(option);
                setMessage("");
              }}
              className={`rounded-full px-5 py-2 text-sm font-semibold ${
                mode === option ? "bg-clay text-paper" : "text-mute"
              }`}
            >
              {option === "signup" ? "Sign up" : "Sign in"}
            </button>
          ))}
        </div>

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
              className="mt-2 w-full border-0 border-b border-line bg-transparent px-0 py-3 text-lg outline-none focus:border-clay"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold tracking-[0.16em] text-mute uppercase">
              Password
            </span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full border-0 border-b border-line bg-transparent px-0 py-3 text-lg outline-none focus:border-clay"
            />
            <span className="mt-2 block text-sm text-mute">At least 6 characters.</span>
          </label>

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

          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-clay px-6 py-3 font-semibold text-paper hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? "Please wait…"
              : mode === "signup"
                ? "Create account →"
                : "Sign in →"}
          </button>
        </form>
      </div>
    </JoinShell>
  );
}
