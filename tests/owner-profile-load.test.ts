import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { TherapistProfile } from "@/components/profile/TherapistProfile";
import { loadReviewViewer } from "@/lib/reviews/viewer";
import { routes } from "@/lib/routes";
import { ADMIN_ONLY_HIDDEN_LABEL } from "@/lib/therapists/listing";
import { fetchTherapistProfile } from "@/lib/therapists/load";

const THERAPIST_ID = "e635d882-fd07-4a7c-bd2e-145b1b71669a";
const OTHER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1";

function client(input: {
  userId: string | null;
  role: "admin" | "therapist" | "patient" | null;
  profileRole?: "admin" | "therapist";
  listed: boolean;
  open: boolean;
}) {
  return {
    auth: {
      async getUser() {
        return {
          data: { user: input.userId ? { id: input.userId } : null },
          error: null,
        };
      },
    },
    from(table: string) {
      const filters: Record<string, unknown> = {};
      const api = {
        select() {
          return api;
        },
        eq(column: string, value: unknown) {
          filters[column] = value;
          return api;
        },
        order() {
          return api;
        },
        maybeSingle() {
          return api;
        },
        then(
          onfulfilled?: (value: { data: unknown; error: null }) => unknown,
          onrejected?: (reason: unknown) => unknown,
        ) {
          return Promise.resolve(row(table, filters)).then(onfulfilled, onrejected);
        },
      };
      return api;
    },
  } as unknown as SupabaseClient;

  function row(table: string, filters: Record<string, unknown>) {
    if (table === "profiles") {
      const requested = String(filters.id ?? "");
      if (requested === THERAPIST_ID) {
        return {
          data: {
            id: THERAPIST_ID,
            role: input.profileRole ?? "admin",
            name: "Christine Lo TEST",
            email: "chrislo5240@gmail.com",
            phone: null,
            about_me: "Test profile",
            photo_key: null,
            video_key: null,
          },
          error: null,
        };
      }
      if (input.userId && requested === input.userId && input.role) {
        return {
          data: { id: input.userId, role: input.role },
          error: null,
        };
      }
      return { data: null, error: null };
    }
    if (table === "therapists") {
      return {
        data: {
          profile_id: THERAPIST_ID,
          credential: "LCSW",
          start_date_of_practice: "2016-01-01",
          open_to_new_clients: input.open,
          listed: input.listed,
          virtual_practice: true,
          in_person_practice: false,
          sliding_scale: false,
          sliding_scale_min_cents: null,
          sliding_scale_max_cents: null,
          superbill: false,
        },
        error: null,
      };
    }
    if (table === "locations") return { data: null, error: null };
    return { data: [], error: null };
  }
}

describe("owner profile load", () => {
  it("opens an admin's own hidden, closed profile and keeps Edit", async () => {
    const supabase = client({
      userId: THERAPIST_ID,
      role: "admin",
      listed: false,
      open: false,
    });
    const data = await fetchTherapistProfile(supabase, THERAPIST_ID);
    const viewer = await loadReviewViewer(supabase, THERAPIST_ID);

    expect(data?.id).toBe(THERAPIST_ID);
    expect(data?.name).toBe("Christine Lo TEST");
    expect(data?.hiddenFromPublic).toBe(true);
    expect(viewer).toEqual({
      userId: THERAPIST_ID,
      role: "admin",
      isOwner: true,
    });

    const html = renderToStaticMarkup(
      createElement(TherapistProfile, {
        data: data!,
        backHref: routes.find,
        viewer,
      }),
    );
    expect(html).toContain("Edit profile");
    expect(html).toContain(routes.joinEdit);
    expect(html).toContain(ADMIN_ONLY_HIDDEN_LABEL);
    expect(html).toContain("Christine Lo TEST");
  });

  it("opens a therapist's own unlisted profile", async () => {
    const data = await fetchTherapistProfile(
      client({
        userId: THERAPIST_ID,
        role: "therapist",
        profileRole: "therapist",
        listed: false,
        open: true,
      }),
      THERAPIST_ID,
    );
    expect(data?.name).toBe("Christine Lo TEST");
    expect(data?.hiddenFromPublic).toBe(true);
  });

  it("still hides an unlisted profile from other people", async () => {
    const hidden = {
      listed: false,
      open: true,
    } as const;
    expect(
      await fetchTherapistProfile(
        client({ userId: null, role: null, ...hidden }),
        THERAPIST_ID,
      ),
    ).toBeNull();
    expect(
      await fetchTherapistProfile(
        client({ userId: OTHER_ID, role: "therapist", ...hidden }),
        THERAPIST_ID,
      ),
    ).toBeNull();
    expect(
      await fetchTherapistProfile(
        client({ userId: OTHER_ID, role: "patient", ...hidden }),
        THERAPIST_ID,
      ),
    ).toBeNull();
  });

  it("still lets another admin open an unlisted practice that is taking clients", async () => {
    const data = await fetchTherapistProfile(
      client({
        userId: OTHER_ID,
        role: "admin",
        listed: false,
        open: true,
      }),
      THERAPIST_ID,
    );
    expect(data?.hiddenFromPublic).toBe(true);
  });

  it("still hides a closed practice from an admin who does not own it", async () => {
    const data = await fetchTherapistProfile(
      client({
        userId: OTHER_ID,
        role: "admin",
        listed: false,
        open: false,
      }),
      THERAPIST_ID,
    );
    expect(data).toBeNull();
  });
});
