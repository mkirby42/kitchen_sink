"use client";

import { FormEvent, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ReviewAuth() {
  const router = useRouter();
  const [mode, setMode] = useState<"signup" | "signin">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
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
      setMessage(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submitAuth} className="rounded-3xl bg-paper px-5 py-5 shadow-sm">
      <p className="text-[11px] font-semibold tracking-[0.14em] text-clay uppercase">
        Leave a review
      </p>
      <p className="mt-2 text-sm text-mute">
        Sign in to post under your name, or anonymously.
      </p>
      <p className="mt-2 text-sm text-mute">
        Demo client: jr@kitchensink.demo / seed-only
      </p>

      <div className="mt-4 inline-flex rounded-full bg-cream p-1">
        {(["signup", "signin"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setMode(option);
              setMessage("");
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              mode === option ? "bg-clay text-paper" : "text-mute"
            }`}
          >
            {option === "signup" ? "Sign up" : "Sign in"}
          </button>
        ))}
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-semibold tracking-[0.16em] text-mute uppercase">
          Email
        </span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1.5 w-full border-0 border-b border-line bg-transparent px-0 py-2 text-base outline-none focus:border-clay"
        />
      </label>

      <label className="mt-4 block">
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
          className="mt-1.5 w-full border-0 border-b border-line bg-transparent px-0 py-2 text-base outline-none focus:border-clay"
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="mt-4 rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-paper hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting
          ? "Please wait…"
          : mode === "signup"
            ? "Create account"
            : "Sign in"}
      </button>

      {message ? <FormMessage>{message}</FormMessage> : null}
    </form>
  );
}

export function FormMessage({ children }: { children: ReactNode }) {
  return (
    <p
      aria-live="polite"
      className="mt-3 rounded-2xl bg-cream px-4 py-3 text-sm text-clay-dark"
    >
      {children}
    </p>
  );
}
