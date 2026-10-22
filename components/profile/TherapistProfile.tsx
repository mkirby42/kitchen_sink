import Link from "next/link";
import { textActionClass } from "@/components/ui/styles";
import {
  consultBookActions,
  type TherapistProfileData,
} from "@/lib/therapists/load";
import type { ReviewViewer } from "@/lib/reviews/viewer";
import {
  profileManageState,
  type ProfileManageState,
} from "@/lib/profile/manage";
import { ProfileManageActions } from "./ProfileManageActions";
import { DesktopProfile } from "./DesktopProfile";
import { PhoneProfileColumn } from "./PhoneProfileColumn";
import {
  PhoneProfileSwipe,
  type PhoneProfileBrowse,
} from "./PhoneProfileSwipe";

export { ProfileNotFound } from "./ProfileSections";

export function TherapistProfile({
  data,
  backHref,
  viewer,
  manage,
  browse = null,
}: {
  data: TherapistProfileData;
  backHref: string;
  viewer: ReviewViewer;
  /** Omit to derive from `viewer`. Pass null to hide the controls. */
  manage?: ProfileManageState | null;
  /** Phone pager across the current Find set. Omitted when there is nothing to swipe. */
  browse?: PhoneProfileBrowse | null;
}) {
  const actions =
    manage === undefined
      ? profileManageState({
          presented: viewer,
          accountRole: viewer.role,
          profileId: data.id,
        })
      : manage;
  const ctas = consultBookActions(data.contact);

  return (
    <main
      className={`mx-auto w-full max-w-6xl px-5 pt-6 sm:px-8 sm:pt-8 ${
        ctas.length > 0
          ? "pb-[calc(6.5rem_+_env(safe-area-inset-bottom))] md:pb-16"
          : "pb-16"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <Link
          href={backHref}
          className={`inline-flex items-center gap-1.5 hover:opacity-80 ${textActionClass}`}
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
        {actions ? (
          <ProfileManageActions
            profileId={data.id}
            name={data.givenName}
            editHref={actions.editHref}
            deleteMode={actions.deleteMode}
            isOwn={actions.isOwn}
          />
        ) : null}
      </div>

      <PhoneProfileSwipe browse={browse}>
        <PhoneProfileColumn data={data} viewer={viewer} />
      </PhoneProfileSwipe>

      <DesktopProfile data={data} viewer={viewer} />
    </main>
  );
}
