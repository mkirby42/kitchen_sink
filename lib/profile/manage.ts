import { presentReviewViewer, type SiteAudience } from "@/lib/audience";
import { joinPath, routes } from "@/lib/routes";
import type { ProfileRole } from "@/lib/role";
import type { ReviewViewer } from "@/lib/reviews/viewer";

export type ProfileManageState = {
  editHref: string;
  /** `own` uses the therapist RPC. `any` uses the admin-or-owner RPC. */
  deleteMode: "own" | "any";
  isOwn: boolean;
};

export function profileEditHref(profileId: string, isOwn: boolean) {
  return isOwn ? routes.joinEdit : joinPath({ edit: true, profile: profileId });
}

/**
 * Controls follow the view switcher. The delete RPC follows the account
 * role: an admin previewed as a therapist still cannot use the therapist-only
 * delete, which rejects admin accounts.
 */
export function profileManageState(input: {
  presented: ReviewViewer;
  accountRole: ProfileRole | null;
  profileId: string;
}): ProfileManageState | null {
  const visible = input.presented.role === "admin" || input.presented.isOwner;
  if (!visible || !input.presented.userId) return null;

  const isOwn = input.presented.userId === input.profileId;
  return {
    editHref: profileEditHref(input.profileId, isOwn),
    deleteMode: input.accountRole === "admin" ? "any" : "own",
    isOwn,
  };
}

export function profileManageForViewer(input: {
  viewer: ReviewViewer;
  audience: SiteAudience;
  profileId: string;
}): ProfileManageState | null {
  return profileManageState({
    presented: presentReviewViewer(input.viewer, input.audience),
    accountRole: input.viewer.role,
    profileId: input.profileId,
  });
}
