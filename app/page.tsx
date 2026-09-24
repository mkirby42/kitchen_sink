import Link from "next/link";
import { homeCtas } from "@/lib/home";
import { supabasePublicConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

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

  const ctas = homeCtas({ signedIn, therapistId, admin });

  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <p className="font-display text-lg text-clay">Kitchen Sink</p>
      <h1 className="mt-3 font-display text-5xl leading-tight tracking-tight">
        Find a therapist who actually{" "}
        <em className="text-clay">fits</em>.
      </h1>
      <p className="mt-6 max-w-xl text-lg text-mute">
        Tap the tags you need. We show therapists who match some of them.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        {ctas.map((cta) => (
          <Link
            key={cta.label}
            href={cta.href}
            className={
              cta.variant === "primary"
                ? "rounded-full bg-clay px-5 py-3 font-medium text-paper hover:bg-clay-dark"
                : "rounded-full border border-line bg-paper px-5 py-3 font-medium text-ink hover:border-ink/20"
            }
          >
            {cta.label}
          </Link>
        ))}
      </div>
    </main>
  );
}
