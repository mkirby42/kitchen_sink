import type { Metadata } from "next";
import { HomeHero } from "@/components/home/HomeHero";
import { homePanels } from "@/lib/home";
import { supabasePublicConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  description:
    "Connect with a therapist you can bring everything — and the kitchen sink — to session.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  let signedIn = false;
  let therapistId: string | null = null;
  let admin = false;

  if (supabasePublicConfig()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      signedIn = Boolean(user);
      if (user) {
        const { data: therapist } = await supabase
          .from("therapists")
          .select("profile_id")
          .eq("profile_id", user.id)
          .maybeSingle();
        if (therapist) therapistId = user.id;
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        admin = profile?.role === "admin";
      }
    } catch {
      signedIn = false;
      therapistId = null;
      admin = false;
    }
  }

  const panels = homePanels({ signedIn, therapistId, admin });

  return <HomeHero client={panels.client} therapist={panels.therapist} />;
}
