"use client";

import { useMemo, useState } from "react";
import {
  filterTherapists,
  isTherapistMediaKey,
  type AdminTherapist,
} from "@/lib/admin/media";
import { DirectoryListing } from "@/components/admin/DirectoryListing";
import { MediaField } from "@/components/admin/MediaField";
import { TherapistPicker } from "@/components/admin/TherapistPicker";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { TextField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
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
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <Eyebrow>Ops</Eyebrow>
      <h1 className="mt-1 font-display text-2xl leading-snug tracking-tight text-ink">
        Upload therapist media
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-mute">
        Choose the therapist who emailed you a file. Photo and intro video go
        into the same storage folders their profile already uses.
      </p>

      <div className="mt-6">
        <TextField
          label="Find therapist"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name or email"
        />
      </div>

      <TherapistPicker
        therapists={visible}
        selectedId={selectedId}
        onSelect={(id) => {
          setSelectedId(id);
          setError("");
          setNotice("");
        }}
      />

      {selected ? (
        <Card className="mt-4 space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display text-2xl tracking-tight text-ink">
                {selected.name}
              </h2>
              <p className="mt-1 text-sm text-mute">
                {selected.email ?? "No email on file"}
              </p>
            </div>
            <Button
              href={routes.therapist(selected.id)}
              variant="secondary"
              size="sm"
            >
              View profile
            </Button>
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
        </Card>
      ) : (
        <Card className="mt-4 px-4 py-3">
          <p className="text-sm text-mute">Pick a therapist to upload.</p>
        </Card>
      )}

      {notice ? (
        <div className="mt-4">
          <Notice>{notice}</Notice>
        </div>
      ) : null}
      {error ? (
        <div className="mt-4">
          <Notice role="alert">{error}</Notice>
        </div>
      ) : null}
    </main>
  );
}
