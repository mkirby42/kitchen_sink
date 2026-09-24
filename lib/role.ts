export type ProfileRole = "therapist" | "patient" | "admin";

export function parseProfileRole(
  role: string | null | undefined,
): ProfileRole | null {
  if (role === "therapist" || role === "patient" || role === "admin") {
    return role;
  }
  return null;
}
