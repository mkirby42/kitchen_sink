"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  DELETE_PROFILE_PHRASE,
  deleteManagedTherapistProfile,
  deleteOwnTherapistProfile,
} from "@/lib/profile/delete-profile";
import type { ProfileManageState } from "@/lib/profile/manage";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";

function PencilIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path
        d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="m13.5 6.5 3 3" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M4 7h16" strokeLinecap="round" />
      <path
        d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 7 7.5 20a1 1 0 0 0 1 .9h7a1 1 0 0 0 1-.9l1-13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProfileManageActions({
  profileId,
  name,
  editHref,
  deleteMode,
  isOwn,
}: ProfileManageState & { profileId: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function close() {
    if (busy) return;
    setOpen(false);
    setError("");
  }

  async function confirmDelete() {
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      const result =
        deleteMode === "own"
          ? await deleteOwnTherapistProfile(supabase, {
              userId: profileId,
              photoKey: null,
              videoKey: null,
              confirm: DELETE_PROFILE_PHRASE,
            })
          : await deleteManagedTherapistProfile(supabase, {
              therapistId: profileId,
              photoKey: null,
              videoKey: null,
            });
      if (!result.ok) {
        setError(result.message);
        setBusy(false);
        return;
      }
      router.push(isOwn ? routes.profileDeleted : routes.find);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete this profile.");
      setBusy(false);
    }
  }

  return (
    <div className="ml-auto flex shrink-0 items-center gap-2" data-profile-manage>
      <Button href={editHref} variant="secondary" size="sm" aria-label="Edit profile">
        <PencilIcon />
        Edit
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        aria-label="Delete profile"
        onClick={() => setOpen(true)}
      >
        <TrashIcon />
        Delete
      </Button>
      {open ? (
        <ProfileDeleteDialog
          name={name}
          isOwn={isOwn}
          busy={busy}
          error={error}
          onCancel={close}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </div>
  );
}

export function ProfileDeleteDialog({
  name,
  isOwn,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  name: string;
  isOwn: boolean;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const who = name.trim() || "this therapist";
  const title = isOwn ? "Delete your profile?" : `Delete ${who}'s profile?`;
  const copy = isOwn
    ? "This permanently removes your therapist page from Kitchen Sink, including your photo, intro video, voice prompt, and reviews. Your login stays, so you can join again. This can't be undone."
    : `This permanently removes ${who}'s therapist page from Kitchen Sink, including their photo, intro video, voice prompt, and reviews. Their login stays. This can't be undone.`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 px-4 py-6 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-delete-title"
        aria-describedby="profile-delete-copy"
        className="w-full max-w-md rounded-card bg-paper p-6 shadow-overlay"
      >
        <h2
          id="profile-delete-title"
          className="font-display text-[1.75rem] font-normal tracking-tight text-ink"
        >
          {title}
        </h2>
        <p id="profile-delete-copy" className="mt-3 text-sm text-mute">
          {copy}
        </p>
        {error ? (
          <p role="alert" className="mt-3 text-sm font-medium text-clay-dark">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={busy} autoFocus>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm} disabled={busy}>
            {busy ? "Deleting…" : "Delete profile"}
          </Button>
        </div>
      </div>
    </div>
  );
}
