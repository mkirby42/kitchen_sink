import type { Metadata } from "next";
import { HomeHero } from "@/components/home/HomeHero";
import { homePanels } from "@/lib/home";

export const metadata: Metadata = {
  description:
    "Connect with a therapist you can bring everything — and the kitchen sink — to session.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const panels = homePanels();

  return <HomeHero client={panels.client} therapist={panels.therapist} />;
}
