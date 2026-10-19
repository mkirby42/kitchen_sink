import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh() {}, push() {}, replace() {} }),
}));

import { TherapistProfile } from "@/components/profile/TherapistProfile";
import { ProfileDeleteDialog } from "@/components/profile/ProfileManageActions";
import { presentReviewViewer } from "@/lib/audience";
import { editSubject } from "@/lib/join/access";
import { profileManageForViewer } from "@/lib/profile/manage";
import type { ReviewViewer } from "@/lib/reviews/viewer";
import { routes } from "@/lib/routes";
import type { TherapistProfileData } from "@/lib/therapists/load";

const profileId = "11111111-1111-4111-8111-111111111111";
const adminId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";

const data: TherapistProfileData = {
  id: profileId,
  name: "Travis White",
  givenName: "Travis",
  email: null,
  phone: null,
  about: null,
  photoUrl: null,
  videoUrl: null,
  voiceUrl: null,
  voicePrompt: null,
  credential: "PsyD",
  years: 8,
  virtual: true,
  inPerson: false,
  office: null,
  education: [],
  credentials: [],
  slidingScale: false,
  slidingScaleMinCents: null,
  slidingScaleMaxCents: null,
  superbill: false,
  licenses: [],
  rates: [],
  tags: [],
  specialties: [],
  modalities: [],
  insurance: [],
  inNetwork: [],
  identity: [],
  cards: [],
  reviews: [],
  pendingReview: null,
  contact: [],
  openToNewClients: true,
};

function viewer(
  role: ReviewViewer["role"],
  userId: string | null,
  isOwner = false,
): ReviewViewer {
  return { userId, role, isOwner };
}

function markup(next: ReviewViewer) {
  return renderToStaticMarkup(
    createElement(TherapistProfile, {
      data,
      backHref: routes.find,
      viewer: next,
    }),
  );
}

describe("profile manage controls", () => {
  it("shows edit and delete to the owner and links to their editor", () => {
    const html = markup(viewer("therapist", profileId, true));
    expect(html).toContain('aria-label="Edit profile"');
    expect(html).toContain('aria-label="Delete profile"');
    expect(html).toContain(`href="${routes.joinEdit}"`);
    expect(html).not.toContain("profile=");
  });

  it("shows them to an admin on someone else's profile", () => {
    const html = markup(viewer("admin", adminId, false));
    expect(html).toContain('aria-label="Edit profile"');
    expect(html).toContain('aria-label="Delete profile"');
    expect(html).toContain(`/join?edit=1&amp;profile=${profileId}`);
  });

  it("hides them from visitors, patients, and other therapists", () => {
    for (const next of [
      viewer(null, null),
      viewer("patient", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1"),
      viewer("therapist", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1"),
    ]) {
      const html = markup(next);
      expect(html).not.toContain("data-profile-manage");
      expect(html).not.toContain('aria-label="Edit profile"');
      expect(html).not.toContain('aria-label="Delete profile"');
    }
  });

  it("follows the view switcher and keeps an admin delete on the admin rpc", () => {
    const admin = viewer("admin", adminId, false);
    expect(
      profileManageForViewer({ viewer: admin, audience: "client", profileId }),
    ).toBeNull();
    expect(
      profileManageForViewer({
        viewer: admin,
        audience: "therapist",
        profileId,
      }),
    ).toBeNull();
    expect(
      profileManageForViewer({
        viewer: { ...admin, isOwner: true, userId: profileId },
        audience: "therapist",
        profileId,
      }),
    ).toMatchObject({
      editHref: routes.joinEdit,
      deleteMode: "any",
      isOwn: true,
    });
    expect(
      profileManageForViewer({ viewer: admin, audience: "admin", profileId }),
    ).toMatchObject({
      editHref: `/join?edit=1&profile=${profileId}`,
      deleteMode: "any",
      isOwn: false,
    });
    expect(presentReviewViewer(admin, "client").isOwner).toBe(false);
  });
});

describe("profile delete dialog", () => {
  it("confirms in plain language and does not ask anyone to type DELETE", () => {
    const html = renderToStaticMarkup(
      createElement(ProfileDeleteDialog, {
        name: "Travis",
        isOwn: false,
        busy: false,
        error: "",
        onCancel() {},
        onConfirm() {},
      }),
    );
    expect(html).toContain("Delete Travis&#x27;s profile?");
    expect(html).toContain("permanently removes");
    expect(html).toContain("Their login stays");
    expect(html).toContain("Delete profile");
    expect(html).toContain("Cancel");
    expect(html).not.toContain("Type DELETE");
  });
});

describe("editSubject", () => {
  it("lets an admin open another profile and refuses everyone else", () => {
    expect(
      editSubject({ userId: adminId, role: "admin", profile: undefined }),
    ).toEqual({ kind: "self" });
    expect(
      editSubject({ userId: adminId, role: "admin", profile: adminId }),
    ).toEqual({ kind: "self" });
    expect(
      editSubject({ userId: adminId, role: "admin", profile: profileId }),
    ).toEqual({ kind: "other", id: profileId });
    expect(
      editSubject({ userId: adminId, role: "therapist", profile: profileId }),
    ).toEqual({ kind: "deny" });
    expect(
      editSubject({ userId: adminId, role: "admin", profile: "not-a-uuid" }),
    ).toEqual({ kind: "deny" });
  });
});
