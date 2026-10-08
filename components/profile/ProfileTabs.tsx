"use client";

import { useState, type ReactNode } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

type ProfileTabsProps = {
  reviewCount: number;
  about: ReactNode;
  reviews: ReactNode;
};

export function ProfileTabs({ reviewCount, about, reviews }: ProfileTabsProps) {
  const [tab, setTab] = useState<"profile" | "reviews">("profile");
  const reviewLabel =
    reviewCount > 0 ? `Reviews · ${reviewCount}` : "Reviews";

  return (
    <section className="mt-10">
      <SegmentedControl
        label="Profile sections"
        value={tab}
        onChange={setTab}
        fill
        options={[
          { value: "profile", label: "Profile" },
          { value: "reviews", label: reviewLabel },
        ]}
      />
      <div className="mt-6">{tab === "profile" ? about : reviews}</div>
    </section>
  );
}
