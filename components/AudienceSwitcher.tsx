"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SegmentedControl } from "@/components/SegmentedControl";
import type { SiteAudience } from "@/lib/audience";
import { setAudienceView } from "@/lib/audience-actions";

const OPTIONS: readonly { value: SiteAudience; label: string }[] = [
  { value: "admin", label: "Admin view" },
  { value: "therapist", label: "Therapist view" },
  { value: "client", label: "Client view" },
];

export function AudienceSwitcher({ audience }: { audience: SiteAudience }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function choose(next: SiteAudience) {
    if (next === audience || pending) return;
    setPending(true);
    try {
      await setAudienceView(next);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <SegmentedControl
      label="Site view"
      value={audience}
      options={OPTIONS}
      onChange={(next) => void choose(next)}
      disabled={pending}
    />
  );
}
