/** Public directory flag. Missing means listed, so an older row shape still shows. */
export function isDirectoryListed(listed: boolean | null | undefined) {
  return listed !== false;
}

/** Missing means published, so a row from before the column still shows. */
export function isProfilePublished(published: boolean | null | undefined) {
  return published !== false;
}

export const ADMIN_ONLY_HIDDEN_LABEL = "Admin only — hidden from public";

export const DRAFT_PROFILE_LABEL = "Draft — not published";

export const NOT_ACCEPTING_CLIENTS_LABEL = "Not accepting new clients";

/**
 * Public Find and /t/[id] require an open, listed, published practice.
 * A signed-in admin may also open someone else's unlisted profile.
 * A signed-in admin may preview a draft, including one that is closed or unlisted.
 * A published practice that is closed stays hidden from everyone except the owner.
 * The owner (admin or therapist) can always open their own page — My profile.
 * `viewerIsAdmin` and `viewerIsOwner` come from the server session, not the client.
 */
export function canViewDirectoryProfile(input: {
  openToNewClients: boolean;
  listed: boolean | null | undefined;
  published?: boolean | null | undefined;
  viewerIsAdmin: boolean;
  viewerIsOwner?: boolean;
}) {
  if (input.viewerIsOwner) return true;
  if (!isProfilePublished(input.published)) return input.viewerIsAdmin;
  if (!input.openToNewClients) return false;
  if (isDirectoryListed(input.listed)) return true;
  return input.viewerIsAdmin;
}
