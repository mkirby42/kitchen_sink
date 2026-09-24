"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
      <h2 className="font-display text-2xl tracking-tight text-ink">
        Delete profile
      </h2>
      <p className="mt-2 text-sm text-mute">
        Permanently remove your public therapist profile from Kitchen Sink.
        Your login stays, so you can join again later.
      </p>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => setOpen(true)}
        className="mt-4 rounded-full border border-clay px-5 py-2.5 text-sm font-semibold text-clay hover:bg-clay/10 disabled:cursor-not-allowed disabled:opacity-45"
      >
        Delete profile
      </button>
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
        className="w-full max-w-md rounded-[1.75rem] bg-paper p-6 shadow-[0_24px_70px_rgba(27,39,68,0.2)]"
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
          className="mt-5 block text-sm font-medium text-ink"
        >
          Type DELETE to confirm
        </label>
        <input
          id="delete-profile-confirm"
          value={phrase}
          autoComplete="off"
          autoFocus
          onChange={(event) => onPhrase(event.target.value)}
          className="mt-2 w-full rounded-xl border border-line bg-cream px-3 py-3 text-ink outline-none focus:border-clay"
        />
        {error ? (
          <p role="alert" className="mt-3 text-sm font-medium text-clay-dark">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-full px-4 py-2.5 text-sm font-medium text-ink hover:bg-cream disabled:opacity-45"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!ready || busy}
            className="rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-paper hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-45"
          >
            {busy ? "Deleting…" : "Delete profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
