"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { fieldClass, fieldLabelClass } from "@/components/ui/styles";
import {
  deleteOwnTherapistProfile,
  deletePhraseMatches,
} from "@/lib/profile/delete-profile";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";

export function DeleteProfile({
  userId,
  photoKey,
  videoKey,
  disabled = false,
}: {
  userId: string;
  photoKey: string | null;
  videoKey: string | null;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function close() {
    if (busy) return;
    setOpen(false);
    setPhrase("");
    setError("");
  }

  async function confirmDelete() {
    setBusy(true);
    setError("");
    try {
      const result = await deleteOwnTherapistProfile(createClient(), {
        userId,
        photoKey,
        videoKey,
        confirm: phrase,
      });
      if (!result.ok) {
        setError(result.message);
        setBusy(false);
        return;
      }
      router.push(routes.profileDeleted);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete your profile.",
      );
      setBusy(false);
    }
  }

  return (
    <section className="mt-12 border-t border-line pt-8">
      <Eyebrow>Delete profile</Eyebrow>
      <p className="mt-2 text-sm text-mute">
        Permanently remove your public therapist profile from Kitchen Sink.
        Your login stays, so you can join again later.
      </p>
      <Button
        type="button"
        variant="secondary"
        className="mt-4"
        disabled={disabled || busy}
        onClick={() => setOpen(true)}
      >
        Delete profile
      </Button>
      {open ? (
        <DeleteProfileDialog
          phrase={phrase}
          busy={busy}
          error={error}
          onPhrase={setPhrase}
          onCancel={close}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </section>
  );
}

export function DeleteProfileDialog({
  phrase,
  busy,
  error,
  onPhrase,
  onCancel,
  onConfirm,
}: {
  phrase: string;
  busy: boolean;
  error: string;
  onPhrase: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ready = deletePhraseMatches(phrase);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 px-4 py-6 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-profile-title"
        aria-describedby="delete-profile-copy"
        className="w-full max-w-md rounded-card bg-paper p-6 shadow-overlay"
      >
        <h2
          id="delete-profile-title"
          className="font-display text-3xl tracking-tight text-ink"
        >
          Delete your therapist profile?
        </h2>
        <p id="delete-profile-copy" className="mt-3 text-sm text-mute">
          This permanently removes your public page, photo, intro video,
          specialties, rates, conversation cards, and reviews about you. Your
          login stays.
        </p>
        <label
          htmlFor="delete-profile-confirm"
          className={`mt-5 block ${fieldLabelClass}`}
        >
          Type DELETE to confirm
        </label>
        <input
          id="delete-profile-confirm"
          value={phrase}
          autoComplete="off"
          autoFocus
          onChange={(event) => onPhrase(event.target.value)}
          className={`${fieldClass} mt-2`}
        />
        {error ? (
          <p role="alert" className="mt-3 text-sm font-medium text-clay-dark">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm} disabled={!ready || busy}>
            {busy ? "Deleting…" : "Delete profile"}
          </Button>
        </div>
      </div>
    </div>
  );
}
