"use client";

import { useState, type ReactNode } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

type ProfileTabsProps = {
  reviewCount: number;
  about: ReactNode;
  reviews: ReactNode;
  /** Full-width switch on the phone. Desktop sizes to the two labels. */
  fill?: boolean;
  /** Heading sits directly above the switch. */
  flush?: boolean;
};

export function ProfileTabs({
  reviewCount,
  about,
  reviews,
  fill = true,
  flush = false,
}: ProfileTabsProps) {
  const [tab, setTab] = useState<"profile" | "reviews">("profile");
  const reviewLabel =
    reviewCount > 0 ? `Reviews · ${reviewCount}` : "Reviews";

  return (
    <section className={flush ? "mt-4" : "mt-8 md:mt-10"}>
      <div data-profile-switch>
        <SegmentedControl
          label="Profile sections"
          value={tab}
          onChange={setTab}
          fill={fill}
          options={[
            { value: "profile", label: "Profile" },
            { value: "reviews", label: reviewLabel },
          ]}
        />
      </div>
      <div className="mt-6 space-y-8">
        <div className={tab === "profile" ? undefined : "hidden"}>
          {about}
        </div>
        <div className={tab === "reviews" ? undefined : "hidden"}>
          {reviews}
        </div>
      </div>
    </section>
  );
}
