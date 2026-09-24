import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { DeleteProfile, DeleteProfileDialog } from "@/components/join/DeleteProfile";
import { JoinWizard } from "@/components/join/JoinWizard";
import { ProfileDeleted } from "@/components/profile/ProfileDeleted";
import {
  DELETE_PROFILE_PHRASE,
  deleteOwnTherapistProfile,
  deletePhraseMatches,
  isOwnObjectKey,
  ownMediaPaths,
  type DeleteProfileInput,
} from "@/lib/profile/delete-profile";
import { routes } from "@/lib/routes";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("next/navigation", () => ({
  usePathname: () => "/join",
  useRouter: () => ({ push() {}, refresh() {}, replace() {} }),
}));

const userId = "11111111-1111-4111-8111-111111111111";

describe("delete confirmation", () => {
  it("accepts only the DELETE phrase, ignoring surrounding space", () => {
    expect(deletePhraseMatches("DELETE")).toBe(true);
    expect(deletePhraseMatches("  DELETE  ")).toBe(true);
    expect(deletePhraseMatches("delete")).toBe(false);
    expect(deletePhraseMatches("")).toBe(false);
    expect(DELETE_PROFILE_PHRASE).toBe("DELETE");
  });

  it("keeps storage paths inside the signed-in therapist prefix", () => {
    expect(isOwnObjectKey(userId, `${userId}/photo.jpg`)).toBe(true);
    expect(isOwnObjectKey(userId, `other/photo.jpg`)).toBe(false);
    expect(isOwnObjectKey(userId, `${userId}/../other/photo.jpg`)).toBe(false);

    expect(
      ownMediaPaths(
        userId,
        ["photo.jpg", "../secret.jpg", "nested/nope.jpg", ""],
        "other-user/video.mp4",
      ),
    ).toEqual([`${userId}/photo.jpg`]);

    expect(
      ownMediaPaths(userId, ["intro.mp4"], `${userId}/photo.jpg`),
    ).toEqual([`${userId}/intro.mp4`, `${userId}/photo.jpg`]);
  });

  it("shows Delete profile on edit and requires the phrase before confirm", () => {
    const closed = renderToStaticMarkup(
      createElement(DeleteProfile, {
        userId,
        photoKey: `${userId}/photo.jpg`,
        videoKey: null,
      }),
    );
    expect(closed).toContain("Delete profile");
    expect(closed).not.toContain("delete-profile-confirm");
    expect(closed).toContain("Your login stays");

    const blocked = renderToStaticMarkup(
      createElement(DeleteProfileDialog, {
        phrase: "delete",
        busy: false,
        error: "",
        onPhrase() {},
        onCancel() {},
        onConfirm() {},
      }),
    );
    expect(blocked).toContain('role="dialog"');
    expect(blocked).toContain("Type DELETE to confirm");
    expect(blocked).toContain('disabled=""');

    const ready = renderToStaticMarkup(
      createElement(DeleteProfileDialog, {
        phrase: "DELETE",
        busy: false,
        error: "",
        onPhrase() {},
        onCancel() {},
        onConfirm() {},
      }),
    );
    expect(ready).toContain("Delete your therapist profile?");
    expect(ready).not.toContain('disabled=""');
  });

  it("puts the control on the edit wizard and keeps it off first-time join", () => {
    const editing = renderToStaticMarkup(
      createElement(JoinWizard, {
        userId,
        email: "maya@example.com",
        initialStep: 1,
        editing: true,
      }),
    );
    expect(editing).toContain("Delete profile");
    expect(editing).not.toContain("delete-profile-confirm");

    const joining = renderToStaticMarkup(
      createElement(JoinWizard, {
        userId,
        email: "maya@example.com",
        initialStep: 1,
      }),
    );
    expect(joining).not.toContain("Delete profile");
  });

  it("lands on a confirmation with a way back and a way to join again", () => {
    const html = renderToStaticMarkup(createElement(ProfileDeleted));
    expect(html).toContain("Your therapist profile is gone.");
    expect(html).toContain(routes.home);
    expect(html).toContain(routes.join);
    expect(html).toContain("Find");
  });
});

describe("deleteOwnTherapistProfile", () => {
  function fakeClient(options?: {
    rpcError?: string;
    listError?: string;
    removeError?: string;
    listed?: { name: string; id: string | null }[];
  }) {
    const calls: { rpc: unknown[]; removed: string[][] } = {
      rpc: [],
      removed: [],
    };
    const client = {
      rpc: async (fn: string, args: { p_confirm: string }) => {
        calls.rpc.push([fn, args]);
        return {
          error: options?.rpcError ? { message: options.rpcError } : null,
        };
      },
      storage: {
        from: (bucket: string) => ({
          list: async () => ({
            data: options?.listError
              ? null
              : bucket === "photos"
                ? (options?.listed ?? [])
                : [{ name: "old.mp4", id: "obj-2" }],
            error: options?.listError ? { message: options.listError } : null,
          }),
          remove: async (paths: string[]) => {
            calls.removed.push(paths);
            return {
              error: options?.removeError
                ? { message: options.removeError }
                : null,
            };
          },
        }),
      },
    };
    return { calls, client: client as unknown as SupabaseClient };
  }

  const input: DeleteProfileInput = {
    userId,
    photoKey: `${userId}/photo.jpg`,
    videoKey: `${userId}/intro.mp4`,
    confirm: "DELETE",
  };

  it("refuses a missing phrase before calling the database", async () => {
    const { calls, client } = fakeClient();
    const result = await deleteOwnTherapistProfile(client, {
      ...input,
      confirm: "yes",
    });
    expect(result).toEqual({ ok: false, message: "Type DELETE to confirm." });
    expect(calls.rpc).toEqual([]);
    expect(calls.removed).toEqual([]);
  });

  it("deletes the profile, then removes only that therapist's media", async () => {
    const { calls, client } = fakeClient({
      listed: [
        { name: "photo.jpg", id: "obj-1" },
        { name: "folder", id: null },
      ],
    });
    const result = await deleteOwnTherapistProfile(client, input);
    expect(result).toEqual({ ok: true });
    expect(calls.rpc).toEqual([
      [
        "delete_own_therapist_profile",
        { p_confirm: "DELETE" },
      ],
    ]);
    expect(calls.removed).toEqual([
      [`${userId}/photo.jpg`],
      [`${userId}/old.mp4`, `${userId}/intro.mp4`],
    ]);
  });

  it("leaves media in place when the profile delete is rejected", async () => {
    const { calls, client } = fakeClient({
      rpcError: "No therapist profile to delete",
    });
    const result = await deleteOwnTherapistProfile(client, input);
    expect(result).toEqual({
      ok: false,
      message: "No therapist profile to delete",
    });
    expect(calls.removed).toEqual([]);
  });

  it("still reports success when storage cleanup fails after the row is gone", async () => {
    const { calls, client } = fakeClient({ removeError: "storage down" });
    const result = await deleteOwnTherapistProfile(client, input);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.mediaError).toBe("storage down");
    expect(calls.rpc).toHaveLength(1);
    expect(calls.removed.length).toBeGreaterThan(0);
  });
});
