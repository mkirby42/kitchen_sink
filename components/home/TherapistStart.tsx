import Link from "next/link";
import { ProfileStartForm } from "@/components/home/ProfileStartForm";
import { Button } from "@/components/ui/Button";
import { pageTitleClass, textLinkClass } from "@/components/ui/styles";
import { routes } from "@/lib/routes";

const steps = [
  {
    n: "01",
    title: "We get it started",
    body: "We gather the professional info you've already shared publicly and prepare your draft.",
    icon: PersonIcon,
  },
  {
    n: "02",
    title: "You make it yours",
    body: "Fill in the missing details, make edits, and add a short video to connect with your people.",
    icon: PencilIcon,
  },
  {
    n: "03",
    title: "You approve it",
    body: "Review your profile before it goes live. You're in control of how you're represented.",
    icon: ApproveIcon,
  },
] as const;

/** Phone-width therapist start. Same block on the homepage and /for-therapists. */
export function TherapistStart({
  titleAs = "h2",
  className = "mt-12",
}: {
  titleAs?: "h1" | "h2";
  className?: string;
}) {
  const Title = titleAs;
  return (
    <section
      aria-labelledby="therapist-start-title"
      className={`mx-auto w-full max-w-md ${className}`}
    >
      <p className="text-center">
        <span className="inline-flex rounded-full bg-lavender px-3 py-1 text-[0.7rem] font-semibold tracking-[0.14em] text-ink">
          FOR THERAPISTS · FREE
        </span>
      </p>
      <Title
        id="therapist-start-title"
        className={`mx-auto mt-5 text-center text-black ${pageTitleClass}`}
      >
        You bring the expertise. We&apos;ll help with the profile.
      </Title>
      <p className="mx-auto mt-4 max-w-xs text-center text-base text-mute">
        Less setup. Your profile, your voice.
      </p>
      <div className="mt-6 flex justify-center">
        <Button href="#get-started">Get my profile started →</Button>
      </div>
      <p className="mt-3 text-center text-sm text-mute">
        Takes about a minute. We do the rest.
      </p>
      <div className="mt-3 flex justify-center">
        <Button href={routes.join} variant="secondary">
          Build it myself from scratch
        </Button>
      </div>

      <div className="mt-10 rounded-card bg-gold/35 px-4 py-6 sm:px-5">
        <h3 className="font-display text-[1.65rem] tracking-tight text-black">
          How it works
        </h3>
        <ol className="mt-4 space-y-3">
          {steps.map((step) => (
            <li key={step.n} className="flex gap-3 rounded-box bg-paper p-3 shadow-card">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lavender text-ink">
                <step.icon />
              </span>
              <span>
                <span className="block text-sm font-semibold text-black">
                  {step.n} — {step.title}
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-body">
                  {step.body}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8">
        <ProfileStartForm />
      </div>

      <div className="mt-6 rounded-card bg-gold/25 px-6 py-6 text-center">
        <p className="text-base text-body">Looking for a therapist instead?</p>
        <p className="mt-2">
          <Link href={routes.find} className={`${textLinkClass} text-base`}>
            Find a therapist →
          </Link>
        </p>
      </div>
    </section>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19.2c1.2-3.2 3.4-4.7 6.5-4.7s5.3 1.5 6.5 4.7" strokeLinecap="round" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M4 20h4l10.2-10.2a2 2 0 0 0 0-2.8l-.2-.2a2 2 0 0 0-2.8 0L5 17v3Z" strokeLinejoin="round" />
      <path d="m13.5 6.5 3 3" strokeLinecap="round" />
    </svg>
  );
}

function ApproveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9.5A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5Z" strokeLinejoin="round" />
      <path d="M14 3.8V8h4" strokeLinejoin="round" />
      <path d="m8.5 13.5 2.2 2.2 4-4.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
