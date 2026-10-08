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
    <section className="mt-8 md:mt-10">
      <div data-profile-switch className="max-md:hidden">
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
      </div>
      <div className="mt-6 space-y-8 max-md:mt-0">
        <div className={tab === "profile" ? undefined : "max-md:block md:hidden"}>
          {about}
        </div>
        <div className={tab === "reviews" ? undefined : "max-md:block md:hidden"}>
          {reviews}
        </div>
      </div>
    </section>
  );
}
