import { Suspense } from "react";
import { PhoneProfileColumn } from "@/components/profile/PhoneProfileColumn";
import { PhoneFind } from "@/components/search/PhoneFind";
import { presentProfileData, presentReviewViewer, type SiteAudience } from "@/lib/audience";
import type { PhoneStackBooking } from "@/lib/search/phone-stack";
import type { SearchRow } from "@/lib/search/rpc";
import type { ReviewViewer } from "@/lib/reviews/viewer";
import { consultBookActions, loadTherapistProfiles } from "@/lib/therapists/load";

export async function PhoneFindSection({
  rows,
  audience,
}: {
  rows: SearchRow[] | null;
  audience: SiteAudience;
}) {
  const ids = rows?.map((row) => row.profile_id) ?? [];
  const loaded = ids.length
    ? await loadTherapistProfiles(ids, audience)
    : {
        profiles: [],
        viewer: { userId: null, role: null },
      };

  const booking: PhoneStackBooking[] = [];
  const slides = (rows ?? []).map((row, index) => {
    const data = loaded.profiles[index] ?? null;
    if (!data) {
      booking.push(null);
      return (
        <p
          key={row.profile_id}
          className="rounded-card bg-paper px-5 py-10 text-center text-mute shadow-card"
        >
          This profile isn&apos;t available right now.
        </p>
      );
    }
    const viewer: ReviewViewer = {
      userId: loaded.viewer.userId,
      role: loaded.viewer.role,
      isOwner: loaded.viewer.userId === data.id,
    };
    const presented = presentProfileData(data, viewer.role, audience);
    booking.push({
      id: presented.id,
      givenName: presented.givenName,
      actions: consultBookActions(presented.contact),
      contact: presented.contact,
    });
    return (
      <PhoneProfileColumn
        key={presented.id}
        data={presented}
        viewer={presentReviewViewer(viewer, audience)}
        showContact={false}
      />
    );
  });

  return (
    <Suspense fallback={null}>
      <PhoneFind rows={rows} booking={booking} slides={slides} />
    </Suspense>
  );
}
