"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { forgotPasswordPath } from "@/lib/auth/password-reset";
import { createClient } from "@/lib/supabase/client";

export function AdminAuth({
  title = "Sign in to upload media",
  lede = "This page is for Kitchen Sink ops. Pick a therapist and upload the photo or intro video they emailed you.",
}: {
  title?: string;
  lede?: string;
}) {
  const router = useRouter();
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
      const result = await supabase.auth.signInWithPassword({ email, password });
      if (result.error) {
        setMessage(result.error.message);
        return;
      }
      if (result.data.session) router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <p className="text-xs font-semibold tracking-[0.2em] text-clay uppercase">
        Ops
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight">{title}</h1>
      <p className="mt-4 text-mute">{lede}</p>
      <form method="post" onSubmit={submit} className="mt-8 space-y-7">
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
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full border-0 border-b border-line bg-transparent px-0 py-3 text-lg outline-none focus:border-clay"
          />
        </label>
        <p className="-mt-4">
          <Link
            href={forgotPasswordPath("admin")}
            className="text-sm font-semibold text-clay hover:text-clay-dark"
          >
            Forgot password?
          </Link>
        </p>
        {message ? (
          <p
            role="alert"
            className="rounded-2xl bg-paper px-4 py-3 text-sm text-clay-dark"
          >
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-clay px-6 py-3 font-semibold text-paper hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Please wait…" : "Sign in →"}
        </button>
      </form>
    </main>
  );
}
