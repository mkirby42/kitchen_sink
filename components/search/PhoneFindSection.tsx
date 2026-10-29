import { PhoneProfileColumn } from "@/components/profile/PhoneProfileColumn";
import { FindNoJsBrowse, FindNoJsForm } from "@/components/search/FindNoJsForm";
import { PhoneFind } from "@/components/search/PhoneFind";
import { presentProfileData, presentReviewViewer, type SiteAudience } from "@/lib/audience";
import type { StackCard } from "@/lib/search/phone-find";
import type { PhoneStackBooking } from "@/lib/search/phone-stack";
import type { SearchFilters, SearchRow } from "@/lib/search/rpc";
import type { ReviewViewer } from "@/lib/reviews/viewer";
import { consultBookActions, loadTherapistProfiles } from "@/lib/therapists/load";

export async function PhoneFindSection({
  rows,
  audience,
  filters,
  layout,
}: {
  rows: SearchRow[] | null;
  audience: SiteAudience;
  filters: SearchFilters;
  layout: "grid" | "one";
}) {
  const ids = rows?.map((row) => row.profile_id) ?? [];
  const loaded = ids.length
    ? await loadTherapistProfiles(ids, audience)
    : {
        profiles: [],
        viewer: { userId: null, role: null },
      };

  const booking: PhoneStackBooking[] = [];
  const listCards: (readonly StackCard[] | undefined)[] = [];
  const slides = (rows ?? []).map((row, index) => {
    const data = loaded.profiles[index] ?? null;
    if (!data) {
      booking.push(null);
      listCards.push(undefined);
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
    listCards.push(presented.cards);
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
    <>
      <noscript>
        <FindNoJsForm filters={filters} layout={layout} />
        <FindNoJsBrowse filters={filters} layout={layout} />
      </noscript>
      <PhoneFind
        rows={rows}
        booking={booking}
        slides={slides}
        listCards={listCards}
        filters={filters}
        layout={layout}
        initialMode={layout === "one" ? "one" : "list"}
      />
    </>
  );
}
