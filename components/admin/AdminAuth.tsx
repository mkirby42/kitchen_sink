"use client";

import { FormEvent, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AccountShell } from "@/components/auth/AccountShell";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { textLinkClass } from "@/components/ui/styles";
import { forgotPasswordPath } from "@/lib/auth/password-reset";
import { createClient } from "@/lib/supabase/client";

export function AdminAuth({
  title = "Sign in to upload media",
  lede = "This page is for Kitchen Sink ops. Pick a therapist and upload the photo, intro video, or voice prompt they emailed you.",
}: {
  title?: string;
  lede?: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mounted || submitting) return;
    setMessage("");
    setSubmitting(true);

    try {
      const supabase = createClient();
      const result = await supabase.auth.signInWithPassword({ email, password });
      if (result.error) {
        setMessage(result.error.message);
        setSubmitting(false);
        return;
      }
      if (result.data.session) {
        // Same cookie race as JoinAuth: hard navigate instead of router.refresh().
        setMessage("Signing you in…");
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- session cookie must land before the next render
        window.location.assign(window.location.pathname + window.location.search);
        return;
      }
      setSubmitting(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign in.");
      setSubmitting(false);
    }
  }

  return (
    <AccountShell eyebrow="Ops" title={title} lede={lede}>
      <form method="post" onSubmit={(event) => void submit(event)} className="space-y-5">
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
        <p className="text-center">
          <Link href={forgotPasswordPath("admin")} className={textLinkClass}>
            Forgot password?
          </Link>
        </p>
        {message ? <Notice role="alert">{message}</Notice> : null}
        <div className="flex justify-center pt-2">
          <Button type="submit" disabled={submitting || !mounted}>
            {submitting ? "Please wait…" : "Sign in →"}
          </Button>
        </div>
      </form>
    </AccountShell>
  );
}
