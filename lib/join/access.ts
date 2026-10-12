import { isProfileId } from "@/lib/join/publish";
import { routes } from "@/lib/routes";
import type { ProfileRole } from "@/lib/role";

export const ADMIN_JOIN_NOTICE =
  "You're signed in as an admin. Submitting replaces your existing test profile, and it stays hidden from the public Find page (admins can still see it, marked admin-only). To create a separate public therapist profile, sign out first and sign up with a different email.";

export type JoinAccess =
  | { kind: "patient" }
  | { kind: "redirect"; href: string }
  | {
      kind: "wizard";
      editing: boolean;
      adminTest: boolean;
      /** Set when an admin is editing a therapist other than themselves. */
      profileId?: string;
      /** Started draft an admin is filling. Returns to Drafts. */
      onBehalfId?: string;
    };

/** Signed-in join gate. Admins can create or replace one test therapist profile, or edit someone else's. */
export function joinAccess(input: {
  userId: string;
  role: ProfileRole | null;
  hasTherapist: boolean;
  editing: boolean;
  /** `/join?edit=1&profile=` — another therapist, admin only. */
  targetProfileId?: string | null;
  /** `/join?edit=1&for=` — a profile_starts draft an admin is filling. */
  forId?: string | null;
}): JoinAccess {
  const target = input.targetProfileId?.trim() ?? "";
  if (target && target !== input.userId) {
    if (input.role === "admin" && isProfileId(target)) {
      return {
        kind: "wizard",
        editing: true,
        adminTest: true,
        profileId: target,
      };
    }
    if (
      input.role === "therapist" ||
      (input.role === "admin" && input.hasTherapist)
    ) {
      return { kind: "redirect", href: routes.therapist(input.userId) };
    }
    return {
      kind: "redirect",
      href: input.role === "admin" ? routes.adminMedia : routes.join,
    };
  }

  if (input.role === "patient") return { kind: "patient" };

  const forId = input.forId?.trim() ?? "";
  if (
    input.role === "admin" &&
    forId &&
    forId !== input.userId &&
    isProfileId(forId)
  ) {
    return {
      kind: "wizard",
      editing: true,
      adminTest: false,
      onBehalfId: forId,
    };
  }

  if (input.role === "admin") {
    if (input.editing && !input.hasTherapist) {
      return { kind: "redirect", href: routes.join };
    }
    return {
      kind: "wizard",
      editing: input.editing && input.hasTherapist,
      adminTest: true,
    };
  }

  if (input.editing && !input.hasTherapist) {
    return { kind: "redirect", href: routes.join };
  }

  if (input.hasTherapist && !input.editing) {
    return { kind: "redirect", href: routes.therapist(input.userId) };
  }

  return {
    kind: "wizard",
    editing: false,
    adminTest: false,
  };
}

const PROFILE_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `/join?edit=1` edits the signed-in profile.
 * `/join?edit=1&profile=` edits someone else, and only an admin may do that.
 */
export function editSubject(input: {
  userId: string;
  role: ProfileRole | null;
  profile: string | undefined;
}): { kind: "self" } | { kind: "other"; id: string } | { kind: "deny" } {
  const raw = input.profile?.trim() ?? "";
  if (!raw || raw === input.userId) return { kind: "self" };
  if (!PROFILE_ID.test(raw) || input.role !== "admin") return { kind: "deny" };
  return { kind: "other", id: raw };
}
