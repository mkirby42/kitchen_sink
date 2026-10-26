"use client";

import { FormEvent, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { submitProfileStart } from "@/lib/profile-start/actions";
import { PROFILE_START_LINK_MAX } from "@/lib/profile-start/validate";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { fieldLabelClass, sectionTitleClass, textLinkClass } from "@/components/ui/styles";

export function ProfileStartSuccessDialog({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClose={onDismiss}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
      className="m-auto w-[min(calc(100%-2rem),24rem)] rounded-card border-0 bg-paper p-6 text-center text-body shadow-overlay backdrop:bg-black/40"
    >
      <h2 id={titleId} className={`text-black ${sectionTitleClass}`}>
        You&apos;re in.
      </h2>
      <p className="mt-2 text-sm font-medium text-ink">Request submitted</p>
      <p className="mx-auto mt-3 max-w-sm text-base leading-relaxed text-body">{message}</p>
      <form method="dialog" className="mt-6">
        <Button type="submit">Got it</Button>
      </form>
    </dialog>
  );
}

export function ProfileStartForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [links, setLinks] = useState([""]);
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  function setLink(index: number, value: string) {
    setLinks((current) => current.map((link, i) => (i === index ? value : link)));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);
    try {
      const result = await submitProfileStart({ name, email, links, company });
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setConfirmation(
        result.confirmation ??
          "We'll email you when your draft is ready to review. Nothing goes live until you approve it.",
      );
    } catch {
      setMessage("We couldn't save that. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form
        id="get-started"
        onSubmit={(event) => void submit(event)}
        className="relative rounded-card bg-paper px-6 py-8 shadow-card sm:px-8"
      >
      <h2 className={`text-center text-black ${sectionTitleClass}`}>
        Get my profile started
      </h2>

      <div className="mt-6 space-y-4">
        <TextField
          label="Your name"
          name="name"
          required
          autoComplete="name"
          placeholder="First and last name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@yourpractice.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <fieldset>
          <legend className={fieldLabelClass}>Your profiles online</legend>
          <p className="mt-1 text-sm text-mute">
            Psychology Today, practice website, LinkedIn… add as many as you have.
          </p>
          <div className="mt-3 space-y-3">
            {links.map((link, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  aria-label={index === 0 ? "Profile link" : `Profile link ${index + 1}`}
                  type="url"
                  inputMode="url"
                  required={index === 0}
                  placeholder="Link to your current profile"
                  value={link}
                  onChange={(event) => setLink(index, event.target.value)}
                  className="ks-field w-full rounded-full border border-line bg-paper px-4 py-2.5 text-base text-body outline-none placeholder:text-mute/70 focus:border-ink"
                />
                {links.length > 1 ? (
                  <button
                    type="button"
                    className="shrink-0 text-sm font-medium text-mute hover:text-ink"
                    onClick={() =>
                      setLinks((current) => current.filter((_, i) => i !== index))
                    }
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          {links.length < PROFILE_START_LINK_MAX ? (
            <button
              type="button"
              className="mt-3 w-full rounded-full border border-dashed border-clay px-4 py-2.5 text-sm font-semibold text-clay hover:bg-lavender"
              onClick={() => setLinks((current) => [...current, ""])}
            >
              + Add another link
            </button>
          ) : null}
        </fieldset>
      </div>

      <div className="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">
        <label>
          Company
          <input
            tabIndex={-1}
            autoComplete="off"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
          />
        </label>
      </div>

      {message ? (
        <div className="mt-4">
          <Notice role="alert">{message}</Notice>
        </div>
      ) : null}

      <div className="mt-6">
        <Button type="submit" variant="gold" className="w-full" disabled={submitting || !mounted}>
          {submitting ? "Sending…" : "Start my profile →"}
        </Button>
      </div>
      <p className="mt-3 text-center text-sm text-mute">
        Nothing goes live until you approve it.
      </p>
      <p className="mt-4 text-center text-sm text-body">
        Rather do it yourself?{" "}
        <Link href={routes.join} className={textLinkClass}>
          Build from scratch
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-body">
        Already have an account?{" "}
        <Link href={routes.joinSignIn} className={textLinkClass}>
          Log in
        </Link>
      </p>
      </form>
      {confirmation ? (
        <ProfileStartSuccessDialog
          message={confirmation}
          onDismiss={() => setConfirmation("")}
        />
      ) : null}
    </>
  );
}
