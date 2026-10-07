"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { TextField } from "@/components/ui/Field";
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
      <Eyebrow>Ops</Eyebrow>
      <h1 className="mt-3 font-display text-4xl tracking-tight">{title}</h1>
      <p className="mt-4 text-mute">{lede}</p>
      <form method="post" onSubmit={submit} className="mt-8 space-y-7">
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
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
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
        <Button type="submit" disabled={submitting}>
          {submitting ? "Please wait…" : "Sign in →"}
        </Button>
      </form>
    </main>
  );
}
