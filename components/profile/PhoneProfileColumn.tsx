import { Card } from "@/components/ui/Card";
import {
  pageSubtitleClass,
  profilePageHeadingClass,
} from "@/components/ui/styles";
import { HiddenFromPublicBadge } from "@/components/directory/HiddenFromPublicBadge";
import { initials, officeAddressLines } from "@/lib/therapists/display";
import {
  cashPayOffered,
  consultBookActions,
  hasSuperbill,
  licenseCaptions,
  reviewAverage,
  sessionFormatPills,
  slidingScaleLabel,
  type TherapistProfileData,
} from "@/lib/therapists/load";
import type { ReviewViewer } from "@/lib/reviews/viewer";
import { DRAFT_PROFILE_LABEL } from "@/lib/therapists/listing";
import { modalityDisplayLabels } from "@/lib/tags/modality-display";
import { directorySpecialties } from "@/lib/tags/presets";
import { AboutPanel } from "./ProfileAbout";
import { ContactCtas } from "./ContactCtas";
import { HeroMedia } from "./HeroMedia";
import { VoicePromptCard } from "./VoicePromptCard";
import { ProfileHeading } from "./ProfileHeading";
import { ProfileTabs } from "./ProfileTabs";
import { ReviewsPanel } from "./ReviewsPanel";
import { cardCorner, TagSection } from "./ProfileSections";
import { possessive } from "./copy";
import { promptAnswerClass, promptLabelClass } from "./prompt-type";

/**
 * Phone profile body. The public profile page and Find's one-at-a-time
 * stack both render this, so the two views cannot drift.
 */
export function PhoneProfileColumn({
  data,
  viewer,
  showContact = true,
}: {
  data: TherapistProfileData;
  viewer: ReviewViewer;
  /** False when a parent pins one shared dock for the active slide. */
  showContact?: boolean;
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
  const avg = reviewAverage(
    data.reviews
      .map((review) => review.stars)
      .filter((n): n is number => n != null),
  );
  const ctas = consultBookActions(data.contact);
  const modalityLabels = modalityDisplayLabels(data.modalities);
  const specialtyLabels = directorySpecialties(data.specialties);
  const hasPhoneFacts =
    modalityLabels.length > 0 || specialtyLabels.length > 0;
  const practicePanel = (flags?: {
    showAbout?: boolean;
    showLogistics?: boolean;
  }) => (
    <AboutPanel
      about={data.about}
      rates={data.rates}
      inNetwork={data.inNetwork}
      sliding={sliding}
      superbill={superbill}
      formats={formats}
      officeLines={officeLines}
      showAbout={flags?.showAbout}
      showLogistics={flags?.showLogistics}
      givenName={data.givenName}
      openToNewClients={data.openToNewClients}
      cashPay={cashPayOffered(data.insurance)}
      profileId={data.id}
      education={data.education}
      credentials={data.credentials}
    />
  );

  return (
    <div data-phone-profile-column="">
      {data.unpublished ? (
        <div className="mt-6">
          <HiddenFromPublicBadge variant="banner" label={DRAFT_PROFILE_LABEL} />
        </div>
      ) : null}
      {data.hiddenFromPublic ? (
        <div className="mt-6">
          <HiddenFromPublicBadge variant="banner" />
        </div>
      ) : null}

      <div className="mt-6">
        <div data-profile-layout="media" className="mx-auto w-full max-w-md">
          <HeroMedia
            name={data.name}
            initials={initials(data.name.replace(/^dr\.?\s+/i, ""))}
            photoUrl={data.photoUrl}
            videoUrl={data.videoUrl}
            licenseCaptions={licenses}
            years={data.years}
          />
          {data.voiceUrl && data.voicePrompt ? (
            <div className="mt-4">
              <VoicePromptCard
                name={data.name}
                prompt={data.voicePrompt}
                src={data.voiceUrl}
              />
            </div>
          ) : null}
        </div>

        <div>
          <div data-profile-show="phone" className="md:hidden">
            {practicePanel({ showAbout: false })}
          </div>

          {showContact ? (
            <ContactCtas
              name={data.givenName}
              actions={ctas}
              contact={data.contact}
              therapistId={data.id}
            />
          ) : null}

          {data.cards.length > 0 ? (
            <section className="mt-10">
              <h2 className={profilePageHeadingClass}>
                Get to know {data.givenName}
              </h2>
              <p className={`mt-1 ${pageSubtitleClass}`}>
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

          {hasPhoneFacts ? (
            <div className="mt-10 space-y-4">
              <TagSection title="Approach in therapy" labels={modalityLabels} />
              <TagSection title="Areas of interest" labels={specialtyLabels} />
            </div>
          ) : null}

          <div className="mt-10">
            <ProfileHeading>{`In ${possessive(data.givenName)} own words`}</ProfileHeading>
            <ProfileTabs
              flush
              reviewCount={data.reviews.length}
              about={data.about ? practicePanel({ showLogistics: false }) : null}
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
      </div>
    </div>
  );
}
