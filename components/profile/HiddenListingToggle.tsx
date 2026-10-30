"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

/**
 * Admin view only. Uses the existing `admin_set_therapist_listed` RPC.
 * Pressed means the public profile is hidden from everyone except the owner and admins.
 */
export function HiddenListingToggle({
  profileId,
  hidden,
}: {
  profileId: string;
  hidden: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      const saved = await supabase.rpc("admin_set_therapist_listed", {
        p_therapist_id: profileId,
        p_listed: hidden,
      });
      if (saved.error) throw saved.error;
      router.refresh();
    } catch (toggleError) {
      const message =
        toggleError instanceof Error
          ? toggleError.message
          : "Unable to update visibility.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        aria-pressed={hidden}
        disabled={busy}
        onClick={toggle}
      >
        {busy ? "Saving…" : "Hidden (admin only)"}
      </Button>
      {error ? <p className="font-sans text-[13px] text-meta">{error}</p> : null}
    </div>
  );
}
