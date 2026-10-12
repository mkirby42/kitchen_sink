const PROFILE_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type EditorSaveAction = "draft" | "publish" | "save";

export type ProfileSaveRpc =
  | "update_therapist_profile"
  | "complete_therapist_join"
  | "admin_save_therapist_profile";

export function isProfileId(value: string) {
  return PROFILE_ID.test(value);
}

/**
 * Drafts are only for a profile that is not live yet.
 * A published profile gets Save changes, which writes the live row.
 * Save as draft is not offered there: this data model has one row, and
 * saving must not unpublish it.
 */
export function editorSaveActions(input: {
  published: boolean;
  editing: boolean;
  /**
   * When false, hide Publish and Save changes.
   * Omitted means the caller is not applying the media rule.
   * A live profile still cannot be saved as a draft.
   */
  mediaReady?: boolean;
  /** Started draft an admin is filling. Only the therapist can publish it. */
  publishHeld?: boolean;
}) {
  if (input.publishHeld && !(input.published && input.editing)) {
    return { draft: true, publish: false, saveChanges: false };
  }
  const canGoLive = input.mediaReady !== false;
  if (input.published && input.editing) {
    return { draft: false, publish: false, saveChanges: canGoLive };
  }
  if (input.published) {
    return { draft: false, publish: canGoLive, saveChanges: false };
  }
  return { draft: true, publish: canGoLive, saveChanges: false };
}

export function profileSaveRpc(input: {
  editing: boolean;
  ownProfile: boolean;
}): ProfileSaveRpc {
  if (!input.ownProfile) return "admin_save_therapist_profile";
  return input.editing ? "update_therapist_profile" : "complete_therapist_join";
}

/** Omit p_publish unless this is a draft. The RPC default publishes. */
export function withPublishArg<T extends Record<string, unknown>>(
  args: T,
  intent: EditorSaveAction,
): T & { p_publish?: false } {
  if (intent === "draft") return { ...args, p_publish: false };
  return args;
}
