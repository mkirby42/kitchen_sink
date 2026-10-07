import type { ProfileRole } from "@/lib/role";
import type { ReviewViewer } from "@/lib/reviews/viewer";
import type { SearchRow } from "@/lib/search/rpc";

export const AUDIENCE_COOKIE = "ks_view";

export const SITE_AUDIENCES = ["admin", "therapist", "client"] as const;

export type SiteAudience = (typeof SITE_AUDIENCES)[number];

export function isSiteAudience(value: string): value is SiteAudience {
  return value === "admin" || value === "therapist" || value === "client";
}

/** Missing or unknown values stay on Admin view. */
export function parseAudience(value: string | null | undefined): SiteAudience {
  if (value === "therapist" || value === "client") return value;
  return "admin";
}

export function audienceCookieOptions() {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 400,
  };
}

/**
 * Cookie write for the view switcher. Non-admins and unknown values get
 * nothing — the cookie cannot grant a role.
 */
export function audienceCookieFor(input: {
  role: ProfileRole | null;
  requested: string;
}): SiteAudience | null {
  if (input.role !== "admin") return null;
  if (!isSiteAudience(input.requested)) return null;
  return input.requested;
}

/**
 * Unlisted directory rows are visible only to a real admin in Admin view.
 * Any other audience forces the public check, which can only hide rows.
 */
export function directoryViewerIsAdmin(input: {
  roleIsAdmin: boolean;
  audience: SiteAudience;
}) {
  return input.roleIsAdmin && input.audience === "admin";
}

/**
 * Profile-page access for the preview. Never turns a non-admin into an admin.
 * Client view drops the owner exception so a hidden profile reads as not found.
 * Therapist view keeps the owner exception (My profile) and drops admin-only rows.
 */
export function previewDirectoryAccess(input: {
  roleIsAdmin: boolean;
  viewerIsOwner: boolean;
  audience: SiteAudience;
}) {
  if (!input.roleIsAdmin) {
    return { viewerIsAdmin: false, viewerIsOwner: input.viewerIsOwner };
  }
  return {
    viewerIsAdmin: input.audience === "admin",
    viewerIsOwner: input.audience !== "client" && input.viewerIsOwner,
  };
}

/**
 * Drop unlisted search rows unless this is a real admin in Admin view.
 * The result is always a subset of `rows`.
 */
export function narrowSearchRows(
  rows: SearchRow[],
  input: { roleIsAdmin: boolean; audience: SiteAudience },
) {
  if (directoryViewerIsAdmin(input)) return rows;
  return rows.filter((row) => row.listed !== false);
}

export type HeaderChrome = {
  uploads: boolean;
  reviews: boolean;
  forTherapists: boolean;
  myProfile: boolean;
  signOut: boolean;
  therapistLogin: boolean;
  switcher: boolean;
};

export function headerChrome(input: {
  role: ProfileRole | null;
  hasTherapist: boolean;
  audience: SiteAudience;
}): HeaderChrome {
  const admin = input.role === "admin";
  const audience = admin ? input.audience : "admin";

  if (!input.role) {
    return {
      uploads: false,
      reviews: false,
      forTherapists: true,
      myProfile: false,
      signOut: false,
      therapistLogin: true,
      switcher: false,
    };
  }

  if (admin && audience === "client") {
    return {
      uploads: false,
      reviews: false,
      forTherapists: true,
      myProfile: false,
      signOut: true,
      therapistLogin: false,
      switcher: true,
    };
  }

  if (input.role === "therapist" || (admin && audience === "therapist")) {
    return {
      uploads: false,
      reviews: false,
      forTherapists: false,
      myProfile: input.role === "therapist" || input.hasTherapist,
      signOut: true,
      therapistLogin: false,
      switcher: admin,
    };
  }

  if (admin) {
    return {
      uploads: true,
      reviews: true,
      forTherapists: true,
      myProfile: input.hasTherapist,
      signOut: true,
      therapistLogin: false,
      switcher: true,
    };
  }

  return {
    uploads: false,
    reviews: false,
    forTherapists: false,
    myProfile: false,
    signOut: true,
    therapistLogin: false,
    switcher: false,
  };
}

/** Ops pages render their tools only in Admin view. The role check still happens first. */
export function adminToolsVisible(input: {
  role: string | null | undefined;
  audience: SiteAudience;
}) {
  return input.role === "admin" && input.audience === "admin";
}

export function presentReviewViewer(
  viewer: ReviewViewer,
  audience: SiteAudience,
): ReviewViewer {
  if (viewer.role !== "admin") return viewer;
  if (audience === "admin") return viewer;
  if (audience === "therapist") return { ...viewer, role: "therapist" };
  return { userId: null, role: null, isOwner: false };
}

export function presentProfileData<
  T extends {
    hiddenFromPublic?: boolean;
    pendingReview: unknown;
    reviews: { mine: boolean }[];
  },
>(data: T, viewerRole: ProfileRole | null, audience: SiteAudience): T {
  if (viewerRole !== "admin" || audience === "admin") return data;
  return {
    ...data,
    hiddenFromPublic: false,
    pendingReview: null,
    reviews: data.reviews.map((review) => ({ ...review, mine: false })),
  };
}
