import { describe, expect, it } from "vitest";
import {
  SITE_AUDIENCES,
  adminToolsVisible,
  audienceCookieFor,
  directoryViewerIsAdmin,
  headerChrome,
  narrowSearchRows,
  previewDirectoryAccess,
  parseAudience,
  presentProfileData,
  presentReviewViewer,
} from "@/lib/audience";
import type { SearchRow } from "@/lib/search/rpc";
import { canViewDirectoryProfile } from "@/lib/therapists/listing";

function row(overrides: Partial<SearchRow> = {}): SearchRow {
  return {
    profile_id: "11111111-1111-4111-8111-111111111111",
    name: "Maya Chen",
    photo_key: null,
    credential: "LMFT",
    start_date_of_practice: "2017-01-01",
    min_price_cents: null,
    min_duration_minutes: null,
    virtual_practice: true,
    in_person_practice: false,
    specialty_labels: [],
    insurance_labels: [],
    match_count: 0,
    matched_labels: [],
    sliding_scale: false,
    video_key: null,
    card_prompt: null,
    card_answer: null,
    card_tag: null,
    ...overrides,
  };
}

const hidden = row({
  profile_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
  name: "Hidden",
  listed: false,
});
const listed = row({
  profile_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
  name: "Listed",
  listed: true,
});
const legacy = row({
  profile_id: "cccccccc-cccc-4ccc-8ccc-ccccccccccc3",
  name: "Legacy",
});
const rows = [hidden, listed, legacy];

describe("admin view switcher", () => {
  it("defaults a missing cookie to admin view", () => {
    expect(parseAudience(undefined)).toBe("admin");
    expect(parseAudience(null)).toBe("admin");
    expect(parseAudience("")).toBe("admin");
    expect(parseAudience("superuser")).toBe("admin");
    expect(parseAudience("client")).toBe("client");
    expect(parseAudience("therapist")).toBe("therapist");
  });

  it("hides the switcher and admin links for anyone who is not an admin", () => {
    for (const audience of SITE_AUDIENCES) {
      for (const role of ["therapist", "patient", null] as const) {
        const chrome = headerChrome({
          role,
          hasTherapist: true,
          audience,
        });
        expect(chrome.switcher).toBe(false);
        expect(chrome.uploads).toBe(false);
        expect(chrome.reviews).toBe(false);
      }
    }

    expect(
      headerChrome({ role: "therapist", hasTherapist: false, audience: "admin" }),
    ).toMatchObject({
      myProfile: true,
      forTherapists: false,
      signOut: true,
      therapistLogin: false,
    });
    expect(
      headerChrome({ role: null, hasTherapist: false, audience: "client" }),
    ).toMatchObject({
      forTherapists: true,
      therapistLogin: true,
      signOut: false,
      myProfile: false,
    });
  });

  it("previews therapist and client chrome without dropping the switcher", () => {
    expect(
      headerChrome({
        role: "admin",
        hasTherapist: true,
        audience: "admin",
      }),
    ).toMatchObject({
      uploads: true,
      reviews: true,
      forTherapists: true,
      myProfile: true,
      switcher: true,
    });
    expect(
      headerChrome({
        role: "admin",
        hasTherapist: false,
        audience: "admin",
      }).myProfile,
    ).toBe(false);
    expect(
      headerChrome({
        role: "admin",
        hasTherapist: true,
        audience: "therapist",
      }),
    ).toMatchObject({
      uploads: false,
      reviews: false,
      forTherapists: false,
      myProfile: true,
      signOut: true,
      switcher: true,
    });
    expect(
      headerChrome({
        role: "admin",
        hasTherapist: false,
        audience: "therapist",
      }).myProfile,
    ).toBe(false);
    expect(
      headerChrome({
        role: "admin",
        hasTherapist: true,
        audience: "client",
      }),
    ).toMatchObject({
      uploads: false,
      reviews: false,
      forTherapists: true,
      myProfile: false,
      signOut: true,
      therapistLogin: false,
      switcher: true,
    });
  });

  it("hides admin-only profiles in client and therapist view", () => {
    expect(
      canViewDirectoryProfile({
        openToNewClients: true,
        listed: false,
        viewerIsAdmin: directoryViewerIsAdmin({
          roleIsAdmin: true,
          audience: "client",
        }),
      }),
    ).toBe(false);
    expect(
      canViewDirectoryProfile({
        openToNewClients: true,
        listed: false,
        viewerIsAdmin: directoryViewerIsAdmin({
          roleIsAdmin: true,
          audience: "therapist",
        }),
      }),
    ).toBe(false);
    expect(
      canViewDirectoryProfile({
        openToNewClients: true,
        listed: false,
        viewerIsAdmin: directoryViewerIsAdmin({
          roleIsAdmin: true,
          audience: "admin",
        }),
      }),
    ).toBe(true);
    expect(
      narrowSearchRows(rows, { roleIsAdmin: true, audience: "client" }).map(
        (item) => item.profile_id,
      ),
    ).toEqual([listed.profile_id, legacy.profile_id]);
    expect(
      narrowSearchRows(rows, {
        roleIsAdmin: true,
        audience: "therapist",
      }).some((item) => item.listed === false),
    ).toBe(false);
  });

  it("keeps the owner's page in therapist view and hides it in client view", () => {
    const hidden = { openToNewClients: true, listed: false as const };
    expect(
      canViewDirectoryProfile({
        ...hidden,
        ...previewDirectoryAccess({
          roleIsAdmin: true,
          viewerIsOwner: true,
          audience: "therapist",
        }),
      }),
    ).toBe(true);
    expect(
      canViewDirectoryProfile({
        ...hidden,
        ...previewDirectoryAccess({
          roleIsAdmin: true,
          viewerIsOwner: true,
          audience: "client",
        }),
      }),
    ).toBe(false);
    expect(
      canViewDirectoryProfile({
        ...hidden,
        ...previewDirectoryAccess({
          roleIsAdmin: true,
          viewerIsOwner: false,
          audience: "therapist",
        }),
      }),
    ).toBe(false);
    expect(
      canViewDirectoryProfile({
        ...hidden,
        ...previewDirectoryAccess({
          roleIsAdmin: false,
          viewerIsOwner: true,
          audience: "client",
        }),
      }),
    ).toBe(true);
    expect(
      previewDirectoryAccess({
        roleIsAdmin: false,
        viewerIsOwner: false,
        audience: "admin",
      }),
    ).toEqual({ viewerIsAdmin: false, viewerIsOwner: false });
  });

  it("does not widen directory access for a non-admin cookie", () => {
    for (const audience of SITE_AUDIENCES) {
      expect(
        directoryViewerIsAdmin({ roleIsAdmin: false, audience }),
      ).toBe(false);
      expect(
        canViewDirectoryProfile({
          openToNewClients: true,
          listed: false,
          viewerIsAdmin: directoryViewerIsAdmin({
            roleIsAdmin: false,
            audience,
          }),
        }),
      ).toBe(false);
      const narrowed = narrowSearchRows(rows, {
        roleIsAdmin: false,
        audience,
      });
      expect(narrowed.every((item) => item.listed !== false)).toBe(true);
      expect(narrowed.length).toBeLessThanOrEqual(rows.length);
      expect(narrowed.every((item) => rows.includes(item))).toBe(true);
    }

    expect(
      narrowSearchRows(rows, { roleIsAdmin: true, audience: "admin" }),
    ).toEqual(rows);
    expect(audienceCookieFor({ role: "therapist", requested: "admin" })).toBe(
      null,
    );
    expect(audienceCookieFor({ role: "patient", requested: "client" })).toBe(
      null,
    );
    expect(audienceCookieFor({ role: null, requested: "admin" })).toBe(null);
    expect(audienceCookieFor({ role: "admin", requested: "owner" })).toBe(
      null,
    );
    expect(audienceCookieFor({ role: "admin", requested: "client" })).toBe(
      "client",
    );
    expect(adminToolsVisible({ role: "therapist", audience: "admin" })).toBe(
      false,
    );
    expect(adminToolsVisible({ role: "admin", audience: "client" })).toBe(
      false,
    );
    expect(adminToolsVisible({ role: "admin", audience: "admin" })).toBe(true);
  });

  it("strips admin profile chrome outside admin view", () => {
    const viewer = {
      userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
      role: "admin" as const,
      isOwner: true,
    };
    expect(presentReviewViewer(viewer, "admin")).toEqual(viewer);
    expect(presentReviewViewer(viewer, "therapist")).toEqual({
      ...viewer,
      role: "therapist",
    });
    expect(presentReviewViewer(viewer, "client")).toEqual({
      userId: null,
      role: null,
      isOwner: false,
    });
    expect(
      presentReviewViewer({ ...viewer, role: "therapist" }, "client"),
    ).toEqual({ ...viewer, role: "therapist" });

    const data = {
      hiddenFromPublic: true,
      pendingReview: { id: "pending" },
      reviews: [{ mine: true }],
    };
    expect(presentProfileData(data, "admin", "client")).toEqual({
      hiddenFromPublic: false,
      pendingReview: null,
      reviews: [{ mine: false }],
    });
    expect(presentProfileData(data, "admin", "admin")).toEqual(data);
    expect(presentProfileData(data, "therapist", "client")).toEqual(data);
  });
});
