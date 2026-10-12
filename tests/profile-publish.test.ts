import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push() {}, replace() {} }),
}));

import { JoinWizard } from "@/components/join/JoinWizard";
import type { JoinDraft } from "@/lib/join/types";
import { PUBLISH_MEDIA_NOTE } from "@/lib/join/validate";
import { TherapistProfile } from "@/components/profile/TherapistProfile";
import {
  editorSaveActions,
  profileSaveRpc,
  withPublishArg,
} from "@/lib/join/publish";
import { narrowSearchRows } from "@/lib/audience";
import type { SearchRow } from "@/lib/search/rpc";
import { routes } from "@/lib/routes";
import type { TherapistProfileData } from "@/lib/therapists/load";
import {
  canViewDirectoryProfile,
  DRAFT_PROFILE_LABEL,
  isProfilePublished,
} from "@/lib/therapists/listing";

describe("editor save actions", () => {
  it("offers draft and publish only before the profile is live", () => {
    expect(editorSaveActions({ published: false, editing: false })).toEqual({
      draft: true,
      publish: true,
      saveChanges: false,
    });
    expect(editorSaveActions({ published: false, editing: true })).toEqual({
      draft: true,
      publish: true,
      saveChanges: false,
    });
    expect(editorSaveActions({ published: true, editing: true })).toEqual({
      draft: false,
      publish: false,
      saveChanges: true,
    });
    expect(editorSaveActions({ published: true, editing: false })).toEqual({
      draft: false,
      publish: true,
      saveChanges: false,
    });
  });

  it("hides publish and save changes until a photo and intro video are both attached", () => {
    expect(
      editorSaveActions({
        published: false,
        editing: false,
        mediaReady: false,
      }),
    ).toEqual({
      draft: true,
      publish: false,
      saveChanges: false,
    });
    expect(
      editorSaveActions({
        published: true,
        editing: true,
        mediaReady: false,
      }),
    ).toEqual({
      draft: false,
      publish: false,
      saveChanges: false,
    });
    expect(
      editorSaveActions({
        published: false,
        editing: true,
        mediaReady: true,
      }),
    ).toEqual({
      draft: true,
      publish: true,
      saveChanges: false,
    });
  });

  it("sends p_publish only for a draft, and uses the admin rpc for someone else", () => {
    expect(withPublishArg({ p_name: "Ada" }, "publish")).toEqual({
      p_name: "Ada",
    });
    expect(withPublishArg({ p_name: "Ada" }, "save")).toEqual({
      p_name: "Ada",
    });
    expect(withPublishArg({ p_name: "Ada" }, "draft")).toEqual({
      p_name: "Ada",
      p_publish: false,
    });
    expect(profileSaveRpc({ editing: true, ownProfile: true })).toBe(
      "update_therapist_profile",
    );
    expect(profileSaveRpc({ editing: false, ownProfile: true })).toBe(
      "complete_therapist_join",
    );
    expect(profileSaveRpc({ editing: true, ownProfile: false })).toBe(
      "admin_save_therapist_profile",
    );
  });
});

describe("draft visibility", () => {
  it("treats a missing flag as published", () => {
    expect(isProfilePublished(undefined)).toBe(true);
    expect(isProfilePublished(null)).toBe(true);
    expect(isProfilePublished(true)).toBe(true);
    expect(isProfilePublished(false)).toBe(false);
  });

  it("hides a draft from the public and shows it to the owner and an admin", () => {
    const draft = {
      openToNewClients: true,
      listed: true,
      published: false,
    };
    expect(
      canViewDirectoryProfile({
        ...draft,
        viewerIsAdmin: false,
      }),
    ).toBe(false);
    expect(
      canViewDirectoryProfile({
        ...draft,
        viewerIsAdmin: true,
      }),
    ).toBe(true);
    expect(
      canViewDirectoryProfile({
        ...draft,
        openToNewClients: false,
        viewerIsAdmin: true,
      }),
    ).toBe(true);
    expect(
      canViewDirectoryProfile({
        ...draft,
        viewerIsAdmin: false,
        viewerIsOwner: true,
      }),
    ).toBe(true);
    expect(
      canViewDirectoryProfile({
        openToNewClients: true,
        listed: true,
        published: true,
        viewerIsAdmin: false,
      }),
    ).toBe(true);
  });

  it("drops drafts from Find unless the viewer is an admin in Admin view", () => {
    const draft = {
      profile_id: "dddddddd-dddd-4ddd-8ddd-ddddddddddd4",
      name: "Draft",
      listed: true,
      published: false,
    } as SearchRow;
    const live = {
      profile_id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee5",
      name: "Live",
      listed: true,
      published: true,
    } as SearchRow;
    expect(
      narrowSearchRows([draft, live], {
        roleIsAdmin: true,
        audience: "admin",
      }).map((row) => row.profile_id),
    ).toEqual([draft.profile_id, live.profile_id]);
    expect(
      narrowSearchRows([draft, live], {
        roleIsAdmin: true,
        audience: "therapist",
      }).map((row) => row.profile_id),
    ).toEqual([live.profile_id]);
    expect(
      narrowSearchRows([draft, live], {
        roleIsAdmin: false,
        audience: "admin",
      }).map((row) => row.profile_id),
    ).toEqual([live.profile_id]);
  });
});

describe("draft and publish buttons", () => {
  const userId = "11111111-1111-4111-8111-111111111111";

  function mediaDraft(): JoinDraft {
    return {
      name: "Maya Chen",
      credential: "LMFT",
      yearsPracticing: 4,
      education: [],
      credentials: [],
      licenses: [{ number: "1", state: "CA" }],
      photoKey: `${userId}/photo.jpg`,
      videoKey: `${userId}/intro.mp4`,
      openToNewClients: true,
      virtual: true,
      inPerson: false,
      specialties: [],
      modalities: [],
      insurance: [],
      identity: [],
      location: null,
      rates: [
        { service_type: "Individual", duration_minutes: 50, price_cents: 10000 },
      ],
      slidingScale: false,
      slidingScaleMinCents: null,
      slidingScaleMaxCents: null,
      cards: [],
      about: "",
      email: "maya@example.com",
      phone: "",
      outreach: ["email"],
      feedback: "",
    };
  }

  function wizard(props: {
    editing?: boolean;
    published?: boolean;
    step?: 1 | 2 | 3 | 4;
    withMedia?: boolean;
    draft?: JoinDraft;
  }) {
    return renderToStaticMarkup(
      createElement(JoinWizard, {
        userId,
        email: "maya@example.com",
        initialStep: props.step ?? 4,
        editing: props.editing,
        published: props.published,
        initialDraft:
          props.draft ?? (props.withMedia === false ? undefined : mediaDraft()),
      }),
    );
  }

  it("uses the shared pills for a draft and for a live edit", () => {
    const draft = wizard({ editing: true, published: false });
    expect(draft).toContain("Save as draft");
    expect(draft).toContain("Publish profile →");
    expect(draft).toContain("Not public yet");
    expect(draft).not.toContain("Save changes →");
    const draftButton = draft.match(/<button[^>]*>Save as draft<\/button>/);
    expect(draftButton?.[0]).toContain("border-ink");
    expect(draftButton?.[0]).toContain("bg-paper");
    const publishButton = draft.match(
      /<button[^>]*>Publish profile →<\/button>/,
    );
    expect(publishButton?.[0]).toContain("bg-ink");
    expect(publishButton?.[0]).toContain("text-paper");

    const live = wizard({ editing: true, published: true });
    expect(live).toContain("Save changes →");
    expect(live).not.toContain("Save as draft");
    const saveButton = live.match(/<button[^>]*>Save changes →<\/button>/);
    expect(saveButton?.[0]).toContain("bg-ink");
    expect(saveButton?.[0]).toContain("text-paper");
    expect(live).not.toContain(PUBLISH_MEDIA_NOTE);
  });

  it("continues the media step without a photo or video and says both are required to publish", () => {
    const html = wizard({ step: 2, withMedia: false });
    expect(html).toContain(PUBLISH_MEDIA_NOTE);
    expect(html).toContain("You can continue without them.");
    expect(html).not.toContain("Add a photo to continue");
    const button = html.match(/<button[^>]*>Continue →<\/button>/);
    expect(button?.[0]).not.toMatch(/\sdisabled(?=[\s>=])/);
  });

  it("offers only save as draft on the last step when a photo or video is missing", () => {
    const missing = wizard({
      editing: true,
      published: false,
      withMedia: false,
    });
    expect(missing).toContain("Save as draft");
    expect(missing).toContain(PUBLISH_MEDIA_NOTE);
    expect(missing).not.toContain("Publish profile →");
    expect(missing).not.toContain("Save changes →");

    const photoOnly = wizard({
      editing: true,
      published: false,
      draft: { ...mediaDraft(), videoKey: null },
    });
    expect(photoOnly).toContain("Save as draft");
    expect(photoOnly).toContain(PUBLISH_MEDIA_NOTE);
    expect(photoOnly).not.toContain("Publish profile →");

    const videoOnly = wizard({
      editing: true,
      published: false,
      draft: { ...mediaDraft(), photoKey: null },
    });
    expect(videoOnly).not.toContain("Publish profile →");

    const live = wizard({ editing: true, published: true, withMedia: false });
    expect(live).toContain(PUBLISH_MEDIA_NOTE);
    expect(live).toContain("Add both before saving.");
    expect(live).not.toContain("Save as draft");
    expect(live).not.toContain("Save changes →");
    expect(live).not.toContain("Publish profile →");
  });
});

describe("draft profile banner", () => {
  const data = {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Maya Chen",
    givenName: "Maya",
    email: null,
    phone: null,
    about: null,
    photoUrl: null,
    videoUrl: null,
    credential: "LMFT",
    years: 1,
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
  } as TherapistProfileData;

  it("shows the draft label on the profile the owner can preview", () => {
    const html = renderToStaticMarkup(
      createElement(TherapistProfile, {
        data: { ...data, unpublished: true },
        backHref: routes.find,
        viewer: { userId: data.id, role: "therapist", isOwner: true },
      }),
    );
    expect(html).toContain(DRAFT_PROFILE_LABEL);
  });
});
