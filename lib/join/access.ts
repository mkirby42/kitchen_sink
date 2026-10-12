import { routes } from "@/lib/routes";
import type { ProfileRole } from "@/lib/role";

export const ADMIN_JOIN_NOTICE =
  "You're signed in as an admin. Submitting replaces your existing test profile, and it stays hidden from the public Find page (admins can still see it, marked admin-only). To create a separate public therapist profile, sign out first and sign up with a different email.";

export type JoinAccess =
  | { kind: "patient" }
  | { kind: "redirect"; href: string }
  | { kind: "wizard"; editing: boolean; adminTest: boolean };

/** Signed-in join gate. Admins can create or replace one test therapist profile. */
export function joinAccess(input: {
  userId: string;
  role: ProfileRole | null;
  hasTherapist: boolean;
  editing: boolean;
}): JoinAccess {
  if (input.role === "patient") return { kind: "patient" };

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
