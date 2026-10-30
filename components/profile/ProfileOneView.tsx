import { FindDetailStack } from "@/components/search/FindDetailStack";
import { FindDetailStage } from "@/components/search/FindDetailStage";
import { HiddenFromPublicBadge } from "@/components/directory/HiddenFromPublicBadge";
import { metaLineClass } from "@/components/ui/styles";
import { findDetailFromProfile } from "@/lib/search/find-detail";
import type { ReviewViewer } from "@/lib/reviews/viewer";
import {
  consultBookActions,
  reviewAverage,
  type TherapistProfileData,
} from "@/lib/therapists/load";
import { DRAFT_PROFILE_LABEL } from "@/lib/therapists/listing";
import { ContactCtas } from "./ContactCtas";
import { NotAcceptingClients } from "./NotAcceptingClients";
import { ReviewsPanel } from "./ReviewsPanel";

/**
 * Public profile body. Same frame, facts, conversation cards, sections,
 * and reviews tab as Find's opened one-at-a-time detail, on the phone
 * and on desktop.
 */
export function ProfileOneView({
  data,
  viewer,
}: {
  data: TherapistProfileData;
  viewer: ReviewViewer;
}) {
  const detail = findDetailFromProfile(data);
  const actions = consultBookActions(data.contact);
  const average = reviewAverage(
    data.reviews
      .map((review) => review.stars)
      .filter((n): n is number => n != null),
  );

  return (
    <div data-profile-layout="one" className="mt-6">
      {data.unpublished ? (
        <HiddenFromPublicBadge variant="banner" label={DRAFT_PROFILE_LABEL} />
      ) : null}
      {data.hiddenFromPublic ? <HiddenFromPublicBadge variant="banner" /> : null}

      <h1 className="font-display text-[40px] leading-[1.15] font-medium text-black">
        {detail.name}
      </h1>
      {detail.credentialLine ? (
        <p className={`mt-1 ${metaLineClass}`}>{detail.credentialLine}</p>
      ) : null}
      <NotAcceptingClients open={!detail.closed} className="mt-3" />

      <div className="mt-6">
        <FindDetailStage
          name={detail.name}
          photoUrl={detail.photoUrl}
          videoUrl={detail.videoUrl}
        />
      </div>

      <FindDetailStack
        detail={detail}
        reviews={
          <ReviewsPanel
            therapistId={data.id}
            therapistName={data.givenName}
            reviews={data.reviews}
            pendingReview={data.pendingReview}
            average={average}
            viewer={viewer}
          />
        }
      />

      <ContactCtas
        name={data.givenName}
        actions={actions}
        contact={data.contact}
        therapistId={data.id}
      />
    </div>
  );
}
