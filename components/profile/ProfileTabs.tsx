"use client";

import { useState, type ReactNode } from "react";

type ProfileTabsProps = {
  reviewCount: number;
  about: ReactNode;
  reviews: ReactNode;
};

export function ProfileTabs({ reviewCount, about, reviews }: ProfileTabsProps) {
  const [tab, setTab] = useState<"profile" | "reviews">("profile");

  return (
    <section className="mt-10">
      <div className="flex rounded-full bg-line/70 p-1">
        <TabButton
          active={tab === "profile"}
          onClick={() => setTab("profile")}
        >
          Profile
        </TabButton>
        <TabButton
          active={tab === "reviews"}
          onClick={() => setTab("reviews")}
        >
          Reviews{reviewCount > 0 ? ` · ${reviewCount}` : ""}
        </TabButton>
      </div>
      <div className="mt-6">{tab === "profile" ? about : reviews}</div>
    </section>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "flex-1 rounded-full bg-paper px-4 py-2.5 text-sm font-medium text-ink shadow-sm"
          : "flex-1 rounded-full px-4 py-2.5 text-sm font-medium text-mute"
      }
    >
      {children}
    </button>
  );
}
