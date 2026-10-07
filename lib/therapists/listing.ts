/** Public directory flag. Missing means listed, so an older row shape still shows. */
export function isDirectoryListed(listed: boolean | null | undefined) {
  return listed !== false;
}

export const ADMIN_ONLY_HIDDEN_LABEL = "Admin only — hidden from public";

/**
 * Public Find and /t/[id] require an open, listed practice.
 * A signed-in admin may also open an unlisted profile. Closed practices stay hidden.
 * `viewerIsAdmin` must come from profiles.role on the server, not from the client.
 */
export function canViewDirectoryProfile(input: {
  openToNewClients: boolean;
  listed: boolean | null | undefined;
  viewerIsAdmin: boolean;
}) {
  if (!input.openToNewClients) return false;
  if (isDirectoryListed(input.listed)) return true;
  return input.viewerIsAdmin;
}
