"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AccountShell } from "@/components/auth/AccountShell";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { textLinkClass } from "@/components/ui/styles";
import { forgotPasswordPath } from "@/lib/auth/password-reset";
import type { ReferralAccess } from "@/lib/referrals/gate";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";

export function ReferralGate({
  access,
}: {
  access: Exclude<ReferralAccess, { kind: "ready" }>;
}) {
  if (access.kind === "unconfigured") {
    return (
      <AccountShell
        eyebrow="Referrals"
        title="Referral board"
        lede="Auth isn't configured yet."
      />
    );
  }
  if (access.kind === "signed-out") return <ReferralSignIn />;
  if (access.kind === "client-preview") {
    return (
      <AccountShell
        eyebrow="Referrals"
        title="Switch to Therapist view"
        lede="The referral board is for therapists with a published profile. Client view stays on the public site."
      />
    );
  }
  if (access.role === "admin" && !access.hasTherapist) {
    return (
      <AccountShell
        eyebrow="Referrals"
        title="Publish a profile to use the board"
        lede="Approving posts is in the Referrals queue. Posting or tapping interested needs a published therapist profile on this account."
      >
        <div className="flex justify-center">
          <Button href={routes.adminReferrals}>Open the queue</Button>
        </div>
      </AccountShell>
    );
  }
  if (!access.hasTherapist) {
    return (
      <AccountShell
        eyebrow="Referrals"
        title="Therapists only"
        lede="The referral board is for therapists with a published Kitchen Sink profile."
      />
    );
  }
  return (
    <AccountShell
      eyebrow="Referrals"
      title="Publish your profile first"
      lede="A published profile is what counts as verified. Drafts can browse Find, and they can't post or respond on the board yet."
    >
      <div className="flex justify-center">
        <Button href={routes.joinEdit}>Finish your profile</Button>
      </div>
    </AccountShell>
  );
}

function ReferralSignIn() {
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
    <AccountShell
      eyebrow="Referrals"
      title="Sign in to the referral board"
      lede="Published therapist profiles can post a referral, see the board, and tap interested."
    >
      <form method="post" onSubmit={submit} className="space-y-5">
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
          <Link href={forgotPasswordPath("join")} className={textLinkClass}>
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
