"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { AccountShell } from "@/components/auth/AccountShell";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { textLinkClass } from "@/components/ui/styles";
import { authPost } from "@/lib/auth/auth-query";
import { forgotPasswordPath } from "@/lib/auth/password-reset";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";

export function AdminAuth({
  title = "Sign in to upload media",
  lede = "This page is for Kitchen Sink ops. Pick a therapist and upload the photo, intro video, or voice prompt they emailed you.",
  returnPath = routes.adminMedia,
  initialEmail = "",
  initialError = "",
}: {
  title?: string;
  lede?: string;
  returnPath?: string;
  initialEmail?: string;
  initialError?: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(initialError);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
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
      <form
        method="post"
        action={authPost.signIn}
        onSubmit={(event) => void submit(event)}
        className="space-y-5"
      >
        <input type="hidden" name="scope" value="admin" />
        <input type="hidden" name="next" value={returnPath} />
        <input type="hidden" name="back" value={returnPath} />
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
          <Button type="submit" disabled={submitting}>
            {submitting ? "Please wait…" : "Sign in →"}
          </Button>
        </div>
      </form>
    </AccountShell>
  );
}
