import type { Metadata } from "next";
import { ProfileDeleted } from "@/components/profile/ProfileDeleted";

export const metadata: Metadata = {
  title: "Profile deleted",
  description: "Your therapist profile has been deleted.",
  robots: { index: false, follow: true },
};

export default function ProfileDeletedPage() {
  return <ProfileDeleted />;
}
