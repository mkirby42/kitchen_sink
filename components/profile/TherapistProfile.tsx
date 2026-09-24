import Link from "next/link";
import type { ReactNode } from "react";
import { formatUsdFromCents, initials } from "@/lib/therapists/display";
import {
  consultBookActions,
  formatLabel,
  hasSuperbill,
  licenseLine,
  reviewAverage,
  slidingScaleLabel,
  type TherapistProfileData,
} from "@/lib/therapists/load";
import type { ReviewViewer } from "@/lib/reviews/viewer";
import { routes } from "@/lib/routes";
import { ContactCtas } from "./ContactCtas";
import { HeroMedia } from "./HeroMedia";
import { ProfileTabs } from "./ProfileTabs";
import { ReviewsPanel } from "./ReviewsPanel";

export function TherapistProfile({
  data,
  backHref,
  viewer,
}: {
  data: TherapistProfileData;
  backHref: string;
  viewer: ReviewViewer;
}) {
  const isOwner = viewer.isOwner;
  const format = formatLabel(data.virtual, data.inPerson);
  const licenses = licenseLine(data.licenses);
  const cashRate = data.rates[0];
  const cashPrice = formatUsdFromCents(cashRate?.price_cents);
  const sliding = slidingScaleLabel(
    data.slidingScale,
    data.slidingScaleMinCents,
    data.slidingScaleMaxCents,
  );
  const superbill = hasSuperbill(data.insurance, data.superbill);
  const avg = reviewAverage(
    data.reviews
      .map((review) => review.stars)
      .filter((n): n is number => n != null),
  );
  const ctas = consultBookActions(data.contact);

  return (
    <main className="relative mx-auto max-w-[26.5rem] overflow-hidden px-5 pb-20">
      <div
        className="pointer-events-none absolute -top-8 -left-10 h-32 w-40 rounded-[2.5rem] bg-clay/25"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-4 -right-8 h-28 w-36 rounded-[2.5rem] bg-ink/10"
        aria-hidden
      />

      <header className="relative z-10 flex items-center justify-center py-4">
        <Link
          href={backHref}
          className="absolute left-0 flex h-11 w-11 items-center justify-center rounded-full bg-paper text-ink shadow-sm"
          aria-label="Back to search"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            aria-hidden
          >
            <path d="M15 5 8 12l7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <Link
          href={routes.home}
          className="font-display text-[1.65rem] leading-none tracking-tight text-ink italic"
        >
          Kitchen Sink
          <span className="ml-1 inline-block text-base not-italic text-clay" aria-hidden>
            ♡
          </span>
        </Link>
        {isOwner ? (
          <Link
            href={routes.joinEdit}
            className="absolute right-0 rounded-full bg-paper px-4 py-2 text-sm font-medium text-ink shadow-sm"
            aria-label="Edit profile"
          >
            Edit
          </Link>
        ) : null}
      </header>

      <HeroMedia
        name={data.name}
        initials={initials(data.name.replace(/^dr\.?\s+/i, ""))}
        photoUrl={data.photoUrl}
        videoUrl={data.videoUrl}
        credential={data.credential}
        licenseText={licenses}
        years={data.years}
        formatLabel={format}
        modalities={data.modalities}
      />

      {data.education.length > 0 || data.credentials.length > 0 ? (
        <section className="mt-4 rounded-2xl bg-paper px-4 py-4 shadow-sm">
          {data.education.length > 0 ? (
            <div>
              <p className="text-[11px] font-semibold tracking-[0.14em] text-clay uppercase">
                Education
              </p>
              <ul className="mt-2 space-y-1 text-sm text-ink">
                {data.education.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {data.credentials.length > 0 ? (
            <div className={data.education.length > 0 ? "mt-4" : undefined}>
              <p className="text-[11px] font-semibold tracking-[0.14em] text-clay uppercase">
                Credentials
              </p>
              <ul className="mt-2 space-y-1 text-sm text-ink">
                {data.credentials.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {data.specialties.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {data.specialties.map((label) => (
            <li
              key={label}
              className="rounded-full bg-paper px-3 py-1.5 text-sm text-ink shadow-sm"
            >
              {label}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <article className="rounded-2xl bg-paper px-4 py-4 shadow-sm">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-clay uppercase">
            Insurance
          </p>
          <p className="mt-1 font-medium text-ink">
            {data.inNetwork.length > 0 ? data.inNetwork.join(", ") : "Cash pay"}
          </p>
          {superbill ? (
            <p className="mt-1 text-sm text-mute">+ out-of-network superbills</p>
          ) : null}
        </article>
        <article className="rounded-2xl bg-paper px-4 py-4 shadow-sm">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-clay uppercase">
            Cash pay fee
          </p>
          <p className="mt-1 font-medium text-ink">
            {cashPrice ? `${cashPrice} / session` : "Ask for rates"}
          </p>
          <p className="mt-1 text-sm text-mute">
            {[
              cashRate ? `${cashRate.duration_minutes} min` : null,
              sliding ? "sliding scale available" : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </article>
      </div>

      <ContactCtas name={data.givenName} actions={ctas} contact={data.contact} />

      {data.cards.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-[1.65rem] tracking-tight text-ink">
            <span aria-hidden className="text-clay">
              ~
            </span>{" "}
            Get to know <em className="text-clay">{data.givenName}</em>
          </h2>
          <p className="mt-1 text-sm text-mute">
            Honest answers, before you ever say hello.
          </p>
          <ul className="mt-5 space-y-3">
            {data.cards.map((card) => {
              const corner = cardCorner(card.tag);
              return (
                <li
                  key={card.prompt}
                  className="relative overflow-hidden rounded-[1.75rem] bg-paper pt-3.5 pr-5 pb-5 pl-5 shadow-sm"
                >
                  <span
                    className={`absolute top-0 left-0 flex h-10 w-10 items-center justify-center rounded-br-2xl rounded-tl-[1.75rem] text-lg ${corner.tone}`}
                    aria-hidden
                  >
                    {corner.icon}
                  </span>
                  <p className="pl-8 font-display text-[15px] text-clay italic">
                    {card.prompt}
                  </p>
                  <p className="mt-2 text-[17px] leading-relaxed text-ink">
                    {card.answer}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <ProfileTabs
        reviewCount={data.reviews.length}
        about={
          <AboutPanel
            about={data.about}
            rates={data.rates}
            inNetwork={data.inNetwork}
            sliding={sliding}
            superbill={superbill}
          />
        }
        reviews={
          <ReviewsPanel
            therapistId={data.id}
            therapistName={data.givenName}
            reviews={data.reviews}
            average={avg}
            viewer={viewer}
          />
        }
      />
    </main>
  );
}

function AboutPanel({
  about,
  rates,
  inNetwork,
  sliding,
  superbill,
}: {
  about: string | null;
  rates: TherapistProfileData["rates"];
  inNetwork: string[];
  sliding: string | null;
  superbill: boolean;
}) {
  return (
    <div>
      {about ? (
        <p className="text-[17px] leading-relaxed text-ink">{about}</p>
      ) : null}
      <div className="mt-5 rounded-3xl bg-clay/10 px-5 py-5">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-clay uppercase">
          Rates & insurance
        </p>
        <dl className="mt-3 divide-y divide-line text-sm">
          {rates.map((rate) => (
            <div
              key={`${rate.service_type}-${rate.duration_minutes}`}
              className="flex items-baseline justify-between gap-4 py-3"
            >
              <dt className="text-ink">
                {rate.service_type} session ({rate.duration_minutes} min)
              </dt>
              <dd className="font-medium text-ink">
                {formatUsdFromCents(rate.price_cents)}
              </dd>
            </div>
          ))}
          {sliding ? (
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="text-ink">Sliding scale</dt>
              <dd className="font-medium text-ink">{sliding}</dd>
            </div>
          ) : null}
          <div className="flex items-baseline justify-between gap-4 py-3">
            <dt className="text-ink">In-network</dt>
            <dd className="text-right font-medium text-ink">
              {inNetwork.length > 0 ? inNetwork.join(" · ") : "None listed"}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-3">
            <dt className="text-ink">Out-of-network</dt>
            <dd className="font-medium text-ink">
              {superbill ? "Superbill provided" : "Not listed"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function cardCorner(tag: string): { icon: ReactNode; tone: string } {
  if (tag === "approach") {
    return { icon: "↑", tone: "bg-[#f3ddd3] text-clay" };
  }
  if (tag === "session_vibe") {
    return { icon: "◷", tone: "bg-[#dceee6] text-[#3f6d5c]" };
  }
  if (tag === "specialty") {
    return {
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M8 4.5h6.5L18 8v11.5H8A1.5 1.5 0 0 1 6.5 18V6A1.5 1.5 0 0 1 8 4.5Z" />
          <path d="M14.5 4.5V8H18" />
        </svg>
      ),
      tone: "bg-[#f6e4d8] text-clay",
    };
  }
  return { icon: "✦", tone: "bg-ink/10 text-ink" };
}

export function ProfileNotFound({ backHref }: { backHref: string }) {
  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <p className="text-sm text-mute">Therapist profile</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">
        We couldn&apos;t find that therapist.
      </h1>
      <p className="mt-4 text-mute">
        They may have closed their practice to new clients, or the link is
        out of date.
      </p>
      <Link
        href={backHref}
        className="mt-8 inline-flex rounded-full bg-clay px-5 py-3 font-medium text-paper hover:bg-clay-dark"
      >
        Back to search
      </Link>
    </main>
  );
}
