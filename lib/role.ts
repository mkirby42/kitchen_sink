export type ProfileRole = "therapist" | "patient" | "admin";

export function parseProfileRole(
  role: string | null | undefined,
): ProfileRole | null {
  if (role === "therapist" || role === "patient" || role === "admin") {
    return role;
  }
  return null;
}

/** Public therapist pages. An admin may publish one test profile and keep admin. */
export function isPublicTherapistRole(role: string | null | undefined) {
  return role === "therapist" || role === "admin";
}
