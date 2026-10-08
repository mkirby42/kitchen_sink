import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { eyebrowClass } from "@/components/ui/styles";
import { HiddenFromPublicBadge } from "@/components/directory/HiddenFromPublicBadge";
import { initials, officeAddressLines } from "@/lib/therapists/display";
import {
  consultBookActions,
  hasSuperbill,
  licenseCaptions,
  reviewAverage,
  sessionFormatPills,
  slidingScaleLabel,
  type TherapistProfileData,
} from "@/lib/therapists/load";
import type { ReviewViewer } from "@/lib/reviews/viewer";
import { routes } from "@/lib/routes";
import { directorySpecialties } from "@/lib/tags/presets";
import { AboutPanel } from "./ProfileAbout";
import { ContactCtas } from "./ContactCtas";
import { HeroMedia } from "./HeroMedia";
import { MobileProfileStream } from "./MobileProfileStream";
import { ProfileTabs } from "./ProfileTabs";
import { ReviewsPanel } from "./ReviewsPanel";
import { cardCorner, TagSection } from "./ProfileSections";
import { promptAnswerClass, promptLabelClass } from "./prompt-type";

export { ProfileNotFound } from "./ProfileSections";

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
  const formats = sessionFormatPills(data.virtual, data.inPerson);
  const officeLines = data.inPerson ? officeAddressLines(data.office) : [];
  const licenses = licenseCaptions(data.licenses);
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
  const hasQualifications =
    data.education.length > 0 || data.credentials.length > 0;

  return (
    <main
      className={`mx-auto w-full max-w-6xl px-5 pt-6 sm:px-8 sm:pt-8 ${
        ctas.length > 0
          ? "pb-[calc(6.5rem_+_env(safe-area-inset-bottom))] md:pb-16"
          : "pb-16"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-ink/80 hover:text-ink"
          aria-label="Back to search"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            aria-hidden
          >
            <path d="M15 5 8 12l7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to search
        </Link>
        {isOwner ? (
          <Button href={routes.joinEdit} variant="secondary" aria-label="Edit profile">
            Edit
          </Button>
        ) : null}
      </div>

      {data.hiddenFromPublic ? (
        <div className="mt-6">
          <HiddenFromPublicBadge variant="banner" />
        </div>
      ) : null}

      <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:items-start lg:gap-10 xl:gap-14">
        <MobileProfileStream
          name={data.name}
          initials={initials(data.name.replace(/^dr\.?\s+/i, ""))}
          photoUrl={data.photoUrl}
          videoUrl={data.videoUrl}
          licenseCaptions={licenses}
          years={data.years}
          cards={data.cards}
        />

        <div
          data-profile-layout="desk"
          className="mx-auto hidden w-full max-w-md md:block lg:mx-0 lg:max-w-none"
        >
          <HeroMedia
            name={data.name}
            initials={initials(data.name.replace(/^dr\.?\s+/i, ""))}
            photoUrl={data.photoUrl}
            videoUrl={data.videoUrl}
            licenseCaptions={licenses}
            years={data.years}
          />
        </div>

        <div className="mt-4 md:mt-8 lg:mt-0">
          {hasQualifications ? (
            <Card className="px-5 py-5 sm:px-6">
              <div className="space-y-4">
                {data.education.length > 0 ? (
                  <div>
                    <h2 className={eyebrowClass}>Education</h2>
                    <ul className="mt-2 space-y-1 text-sm text-ink">
                      {data.education.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {data.credentials.length > 0 ? (
                  <div>
                    <h2 className={eyebrowClass}>Credentials</h2>
                    <ul className="mt-2 space-y-1 text-sm text-ink">
                      {data.credentials.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </Card>
          ) : null}

          <TagSection title="Modalities" labels={data.modalities} />
          <TagSection
            title="Specialties"
            labels={directorySpecialties(data.specialties)}
          />

          <ContactCtas
            name={data.givenName}
            actions={ctas}
            contact={data.contact}
          />

          {data.cards.length > 0 ? (
            <section className="mt-10 hidden md:block">
              <h2 className="font-display text-3xl tracking-tight text-ink">
                Get to know <em className="text-clay">{data.givenName}</em>
              </h2>
              <p className="mt-1 text-sm text-mute">
                Honest answers, before you ever say hello.
              </p>
              <ul className="mt-5 space-y-3">
                {data.cards.map((card) => {
                  const corner = cardCorner(card.tag);
                  return (
                    <Card
                      as="li"
                      key={card.prompt}
                      data-prompt-variant="classic"
                      className="relative overflow-hidden pt-3.5 pr-5 pb-5 pl-5"
                    >
                      <span
                        className={`absolute top-0 left-0 flex h-10 w-10 items-center justify-center rounded-br-2xl rounded-tl-[var(--radius-card)] text-lg ${corner.tone}`}
                        aria-hidden
                      >
                        {corner.icon}
                      </span>
                      <p className={`pl-8 ${promptLabelClass}`}>{card.prompt}</p>
                      <p className={promptAnswerClass}>{card.answer}</p>
                    </Card>
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
                formats={formats}
                officeLines={officeLines}
              />
            }
            reviews={
              <ReviewsPanel
                therapistId={data.id}
                therapistName={data.givenName}
                reviews={data.reviews}
                pendingReview={data.pendingReview}
                average={avg}
                viewer={viewer}
              />
            }
          />
        </div>
      </div>
    </main>
  );
}
