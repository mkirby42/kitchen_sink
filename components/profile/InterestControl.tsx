"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { setInterest, type InterestViewer } from "@/lib/interest/viewer";

export function InterestControl({
  therapistId,
  givenName,
  viewer,
}: {
  therapistId: string;
  givenName: string;
  viewer: InterestViewer;
}) {
  const router = useRouter();
  const [showAuth, setShowAuth] = useState(false);
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (viewer.isOwner || viewer.role === "therapist") return null;

  const signedIn = Boolean(viewer.userId);

  async function writeInterest(wanted: boolean) {
    setMessage("");
    setSubmitting(true);
    try {
      const supabase = createClient();
      await setInterest(supabase, therapistId, wanted);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to update interest.",
      );
    } finally {
      setSubmitting(false);
    }
  }

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
        await setInterest(supabase, therapistId, true);
        router.refresh();
        return;
      }

      if (mode === "signup" && result.data.user) {
        setMessage("Check your email to confirm, then sign in.");
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to authenticate.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-4 rounded-2xl bg-paper px-4 py-4 shadow-sm">
      <p className="text-[11px] font-semibold tracking-[0.14em] text-clay uppercase">
        Interested in {givenName}
      </p>

      {signedIn && viewer.interested ? (
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            disabled
            className="flex-1 rounded-full border-2 border-pine bg-paper px-3 py-[0.85rem] text-[15px] font-semibold text-pine"
          >
            Interested
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void writeInterest(false)}
            className="shrink-0 text-sm font-semibold text-mute hover:text-clay-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Please wait…" : "Remove"}
          </button>
        </div>
      ) : null}

      {signedIn && !viewer.interested ? (
        <button
          type="button"
          disabled={submitting}
          onClick={() => void writeInterest(true)}
          className="mt-3 w-full rounded-full bg-clay px-3 py-[0.85rem] text-[15px] font-semibold text-paper hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Please wait…" : "I'm interested"}
        </button>
      ) : null}

      {!signedIn ? (
        <>
          <button
            type="button"
            aria-expanded={showAuth}
            onClick={() => setShowAuth(true)}
            className="mt-3 w-full rounded-full bg-clay px-3 py-[0.85rem] text-[15px] font-semibold text-paper hover:bg-clay-dark"
          >
            I&apos;m interested
          </button>

          {showAuth ? (
            <form onSubmit={submitAuth} className="mt-4 space-y-4">
              <p className="text-sm text-mute">
                We&apos;ll keep you anonymous on their list. You can still
                email or call them below.
              </p>
              <p className="text-sm text-mute">
                Demo patient: jr@kitchensink.demo / seed-only
              </p>

              <div className="inline-flex rounded-full bg-cream p-1">
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
                  className="mt-1.5 w-full border-0 border-b border-line bg-transparent px-0 py-2 text-base outline-none focus:border-clay"
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
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-1.5 w-full border-0 border-b border-line bg-transparent px-0 py-2 text-base outline-none focus:border-clay"
                />
                <span className="mt-1.5 block text-sm text-mute">
                  At least 6 characters.
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-paper hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Please wait…"
                  : mode === "signup"
                    ? "Create account →"
                    : "Sign in →"}
              </button>
            </form>
          ) : null}
        </>
      ) : null}

      {message ? (
        <p
          aria-live="polite"
          className="mt-3 rounded-2xl bg-cream px-4 py-3 text-sm text-clay-dark"
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}
