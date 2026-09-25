"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  filterTherapists,
  isTherapistMediaKey,
  type AdminTherapist,
} from "@/lib/admin/media";
import { DirectoryListing } from "@/components/admin/DirectoryListing";
import { MediaField } from "@/components/admin/MediaField";
import { mediaFileError } from "@/lib/join/media";
import { uploadJoinMedia } from "@/lib/join/submit";
import { routes } from "@/lib/routes";
import { createClient } from "@/lib/supabase/client";
import { storagePublicUrl } from "@/lib/therapists/display";

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return fallback;
}

export function HelperUpload({
  therapists: initialTherapists,
  initialSelectedId = null,
}: {
  therapists: AdminTherapist[];
  initialSelectedId?: string | null;
}) {
  const [therapists, setTherapists] = useState(initialTherapists);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const [uploading, setUploading] = useState<"photo" | "video" | null>(null);
  const [savingListing, setSavingListing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const busy = uploading !== null || savingListing;

  const visible = useMemo(
    () => filterTherapists(therapists, query),
    [therapists, query],
  );
  const selected = therapists.find((row) => row.id === selectedId) ?? null;

  async function setDirectoryListed(listed: boolean) {
    if (!selected || busy) return;
    setError("");
    setNotice("");
    setSavingListing(true);
    try {
      const supabase = createClient();
      const saved = await supabase.rpc("admin_set_therapist_listed", {
        p_therapist_id: selected.id,
        p_listed: listed,
      });
      if (saved.error) throw saved.error;
      setTherapists((current) =>
        current.map((row) => (row.id === selected.id ? { ...row, listed } : row)),
      );
      setNotice(
        listed
          ? `${selected.name} is on Find.`
          : `${selected.name} is hidden from Find.`,
      );
    } catch (toggleError) {
      setError(errorMessage(toggleError, "Unable to update the listing."));
    } finally {
      setSavingListing(false);
    }
  }

  async function chooseFile(kind: "photo" | "video", file?: File) {
    if (!file || !selected) return;
    const fileError = mediaFileError(kind, file);
    if (fileError) {
      setNotice("");
      setError(fileError);
      return;
    }

    setError("");
    setNotice("");
    setUploading(kind);
    try {
      const supabase = createClient();
      const path = await uploadJoinMedia(supabase, selected.id, kind, file);
      if (!isTherapistMediaKey(selected.id, path)) {
        throw new Error("Upload path was not under this therapist.");
      }
      const saved = await supabase.rpc("admin_set_therapist_media", {
        p_therapist_id: selected.id,
        p_kind: kind,
        p_key: path,
      });
      if (saved.error) throw saved.error;

      setTherapists((current) =>
        current.map((row) =>
          row.id === selected.id
            ? {
                ...row,
                photoKey: kind === "photo" ? path : row.photoKey,
                videoKey: kind === "video" ? path : row.videoKey,
              }
            : row,
        ),
      );
      setNotice(
        `${kind === "photo" ? "Photo" : "Intro video"} saved for ${selected.name}.`,
      );
    } catch (uploadError) {
      setError(errorMessage(uploadError, `Unable to upload ${kind}.`));
    } finally {
      setUploading(null);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-xs font-semibold tracking-[0.2em] text-clay uppercase">
        Ops
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight">
        Upload therapist media
      </h1>
      <p className="mt-4 max-w-xl text-mute">
        Choose the therapist who emailed you a file. Photo and intro video go
        into the same storage folders their profile already uses.
      </p>

      <label className="mt-8 block">
        <span className="text-xs font-semibold tracking-[0.16em] text-mute uppercase">
          Find therapist
        </span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name or email"
          className="mt-2 w-full border-0 border-b border-line bg-transparent px-0 py-3 text-lg outline-none focus:border-clay"
        />
      </label>

      <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto">
        {visible.length === 0 ? (
          <li className="rounded-2xl bg-paper px-4 py-3 text-sm text-mute">
            No therapist matches that.
          </li>
        ) : (
          visible.map((therapist) => {
            const active = therapist.id === selectedId;
            return (
              <li key={therapist.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setSelectedId(therapist.id);
                    setError("");
                    setNotice("");
                  }}
                  className={`w-full rounded-2xl border px-4 py-3 text-left ${
                    active
                      ? "border-clay bg-paper"
                      : "border-line bg-paper hover:border-ink/20"
                  }`}
                >
                  <span className="block font-medium">{therapist.name}</span>
                  <span className="mt-1 block text-sm text-mute">
                    {[therapist.credential, therapist.email]
                      .filter(Boolean)
                      .join(" · ") || "No email on file"}
                    {therapist.videoKey ? " · Intro video" : " · No intro video"}
                    {therapist.openToNewClients ? "" : " · Not open to new clients"}
                    {therapist.listed ? "" : " · Hidden from Find"}
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>

      {selected ? (
        <section className="mt-8 space-y-6 rounded-[1.75rem] bg-paper p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl tracking-tight">
                {selected.name}
              </h2>
              <p className="mt-1 text-sm text-mute">
                {selected.email ?? "No email on file"}
              </p>
            </div>
            <Link
              href={routes.therapist(selected.id)}
              className="text-sm font-medium text-clay hover:text-clay-dark"
            >
              View profile
            </Link>
          </div>

          <MediaField
            kind="photo"
            uploaded={Boolean(selected.photoKey)}
            preview={storagePublicUrl("photos", selected.photoKey)}
            busy={uploading === "photo"}
            disabled={busy}
            onFile={(file) => void chooseFile("photo", file)}
          />
          <DirectoryListing
            listed={selected.listed}
            busy={savingListing}
            disabled={busy}
            onToggle={() => void setDirectoryListed(!selected.listed)}
          />
          <MediaField
            kind="video"
            uploaded={Boolean(selected.videoKey)}
            preview={storagePublicUrl("videos", selected.videoKey)}
            busy={uploading === "video"}
            disabled={busy}
            onFile={(file) => void chooseFile("video", file)}
          />
        </section>
      ) : (
        <p className="mt-8 text-sm text-mute">Pick a therapist to upload.</p>
      )}

      {notice ? (
        <p role="status" className="mt-6 rounded-2xl bg-paper px-5 py-4 text-sm">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-6 rounded-2xl bg-paper px-5 py-4 text-sm text-clay-dark">
          {error}
        </p>
      ) : null}
    </main>
  );
}
