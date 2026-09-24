import { routes } from "@/lib/routes";
import type { ProfileRole } from "@/lib/role";

export const ADMIN_JOIN_NOTICE =
  "This account stays admin. Submitting publishes a therapist profile for testing. If you already have one, this replaces it.";

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
