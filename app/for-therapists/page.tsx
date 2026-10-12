import type { Metadata } from "next";
import { TherapistStart } from "@/components/home/TherapistStart";

export const metadata: Metadata = {
  title: "For therapists",
  description:
    "You bring the expertise. We'll help with the profile. Share a link to a profile you already have, or build one from scratch.",
  alternates: { canonical: "/for-therapists" },
};

export default function ForTherapistsPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <TherapistStart titleAs="h1" className="mt-0" />
    </main>
  );
}
