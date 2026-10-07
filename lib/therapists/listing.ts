/** Public directory flag. Missing means listed, so an older row shape still shows. */
export function isDirectoryListed(listed: boolean | null | undefined) {
  return listed !== false;
}

export const ADMIN_ONLY_HIDDEN_LABEL = "Admin only — hidden from public";

/**
 * Public Find and /t/[id] require an open, listed practice.
 * A signed-in admin may also open someone else's unlisted profile.
 * Closed practices stay hidden from everyone except the owner.
 * The owner (admin or therapist) can always open their own page — My profile.
 * `viewerIsAdmin` and `viewerIsOwner` come from the server session, not the client.
 */
export function canViewDirectoryProfile(input: {
  openToNewClients: boolean;
  listed: boolean | null | undefined;
  viewerIsAdmin: boolean;
  viewerIsOwner?: boolean;
}) {
  if (input.viewerIsOwner) return true;
  if (!input.openToNewClients) return false;
  if (isDirectoryListed(input.listed)) return true;
  return input.viewerIsAdmin;
}
