import { buttonClass } from "@/components/ui/styles";
import { newsletter, newsletterLinkProps } from "@/lib/newsletter";

function EnvelopeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M4 7.5 12 13l8-5.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Navy newsletter band under the homepage audience card. */
export function NewsletterWhy() {
  return (
    <section
      id="why-kitchen-sink"
      aria-labelledby="why-kitchen-sink-title"
      className="mt-16 rounded-card bg-ink px-6 py-14 text-center sm:mt-20 sm:px-12 sm:py-16"
    >
      <p className="inline-flex items-center justify-center gap-2 text-[0.68rem] font-semibold tracking-[0.22em] text-clay uppercase">
        <EnvelopeIcon />
        From the newsletter
      </p>
      <h2
        id="why-kitchen-sink-title"
        className="mx-auto mt-4 max-w-3xl text-balance font-display text-[clamp(2.15rem,4.6vw,3.35rem)] leading-[1.12] font-medium tracking-tight text-paper italic"
      >
        Why <span className="text-clay">Kitchen Sink?</span>
      </h2>
      <p className="mx-auto mt-3 max-w-md text-base text-paper/75 sm:text-lg">
        The story behind the name and our Why.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-7">
        <a
          href={newsletter.story}
          {...newsletterLinkProps}
          className={buttonClass("primary")}
        >
          Read the story
          <span aria-hidden="true">→</span>
        </a>
        <a
          href={newsletter.subscribe}
          {...newsletterLinkProps}
          className="text-sm font-medium text-paper underline decoration-paper/80 underline-offset-4 hover:text-cream"
        >
          Subscribe to the newsletter
        </a>
      </div>
    </section>
  );
}
