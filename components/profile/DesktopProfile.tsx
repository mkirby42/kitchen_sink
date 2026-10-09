import { Card } from "@/components/ui/Card";
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
import { modalityDisplayLabels } from "@/lib/tags/modality-display";
import { directorySpecialties } from "@/lib/tags/presets";
import { AboutLead } from "./AboutLead";
import { DesktopIdentity } from "./DesktopIdentity";
import { DesktopPractice } from "./DesktopPractice";
import { HeroMedia } from "./HeroMedia";
import { ProfileHeading } from "./ProfileHeading";
import { ProfileTabs } from "./ProfileTabs";
import { ReviewsPanel } from "./ReviewsPanel";
import { possessive } from "./copy";

export function DesktopProfile({
  data,
  viewer,
}: {
  data: TherapistProfileData;
  viewer: ReviewViewer;
}) {
  const formats = sessionFormatPills(data.virtual, data.inPerson);
  const officeLines = data.inPerson ? officeAddressLines(data.office) : [];
  const licenses = licenseCaptions(data.licenses);
  const sliding = slidingScaleLabel(
    data.slidingScale,
    data.slidingScaleMinCents,
    data.slidingScaleMaxCents,
  );
  const superbill = hasSuperbill(data.insurance, data.superbill);
  const actions = consultBookActions(data.contact);
  const avg = reviewAverage(
    data.reviews
      .map((review) => review.stars)
      .filter((n): n is number => n != null),
  );
  const watchLabel = data.videoUrl
    ? `Watch ${possessive(data.givenName)} intro`
    : null;

  return (
    <div
      data-profile-layout="desk"
      className="mt-6 hidden md:grid md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] md:items-start md:gap-8 lg:grid-cols-[minmax(0,26.5rem)_minmax(0,1fr)] lg:gap-12"
    >
      <div className="min-w-0">
        <HeroMedia
          variant="poster"
          name={data.name}
          initials={initials(data.name.replace(/^dr\.?\s+/i, ""))}
          photoUrl={data.photoUrl}
          videoUrl={data.videoUrl}
          licenseCaptions={licenses}
          years={data.years}
          watchLabel={watchLabel}
        />
        <DesktopIdentity
          data={data}
          formats={formats}
          licenses={licenses}
          officeLines={officeLines}
          sliding={sliding}
          superbill={superbill}
          actions={actions}
        />
        <DesktopPractice
          givenName={data.givenName}
          specialties={directorySpecialties(data.specialties)}
          modalities={modalityDisplayLabels(data.modalities)}
          education={data.education}
          credentials={data.credentials}
        />
      </div>
      <div className="min-w-0">
        {data.cards.length > 0 ? (
          <section>
            <h2 className="font-display text-4xl leading-tight tracking-tight text-ink">
              Get to know <em className="text-clay">{data.givenName}</em>
            </h2>
            <p className="mt-1 text-sm text-mute">
              Honest answers, before you ever say hello.
            </p>
            <ul className="mt-5 space-y-3">
              {data.cards.map((card) => (
                <Card
                  as="li"
                  key={card.prompt}
                  data-prompt-variant="desk"
                  className="px-5 py-5"
                >
                  <p className="font-display text-[15px] leading-snug text-clay">
                    {card.prompt}
                  </p>
                  <p className="mt-3 font-display text-2xl leading-snug text-ink">
                    {card.answer}
                  </p>
                </Card>
              ))}
            </ul>
          </section>
        ) : null}
        <section className={data.cards.length > 0 ? "mt-10" : undefined}>
          <ProfileHeading
            lead={`In ${possessive(data.givenName)} own`}
            accent="words"
          />
          <ProfileTabs
            flush
            fill={false}
            reviewCount={data.reviews.length}
            about={<AboutLead about={data.about} />}
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
        </section>
      </div>
    </div>
  );
}
