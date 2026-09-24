import type { SupabaseClient } from "@supabase/supabase-js";

export const DELETE_PROFILE_PHRASE = "DELETE";

const MEDIA_BUCKETS = ["photos", "videos"] as const;
const LIST_PAGE = 100;

export type DeleteProfileInput = {
  userId: string;
  photoKey: string | null;
  videoKey: string | null;
  confirm: string;
};

export type DeleteProfileResult =
  | { ok: true; mediaError?: string }
  | { ok: false; message: string };

export function deletePhraseMatches(value: string) {
  return value.trim() === DELETE_PROFILE_PHRASE;
}

export function isOwnObjectKey(userId: string, key: string) {
  const prefix = `${userId}/`;
  if (!key.startsWith(prefix)) return false;
  const rest = key.slice(prefix.length);
  return (
    rest.length > 0 &&
    !rest.startsWith("/") &&
    !rest.includes("\\") &&
    !rest.includes("..")
  );
}

function isSinglePathSegment(name: string) {
  return (
    name.length > 0 &&
    name !== "." &&
    name !== ".." &&
    !name.includes("/") &&
    !name.includes("\\") &&
    !name.includes("..")
  );
}

/** Object paths under photos/{userId}/ or videos/{userId}/ only. */
export function ownMediaPaths(
  userId: string,
  listedNames: readonly string[],
  extraKey: string | null,
) {
  const paths = new Set<string>();
  for (const name of listedNames) {
    if (!isSinglePathSegment(name)) continue;
    paths.add(`${userId}/${name}`);
  }
  if (extraKey && isOwnObjectKey(userId, extraKey)) paths.add(extraKey);
  return [...paths];
}

async function listedNames(
  bucket: ReturnType<SupabaseClient["storage"]["from"]>,
  userId: string,
) {
  const names: string[] = [];
  for (let offset = 0; offset < 1000; offset += LIST_PAGE) {
    const { data, error } = await bucket.list(userId, {
      limit: LIST_PAGE,
      offset,
    });
    if (error) throw new Error(error.message);
    const page = data ?? [];
    for (const file of page) {
      if (file.id && file.name) names.push(file.name);
    }
    if (page.length < LIST_PAGE) break;
  }
  return names;
}

export async function removeOwnTherapistMedia(
  supabase: SupabaseClient,
  input: Pick<DeleteProfileInput, "userId" | "photoKey" | "videoKey">,
) {
  const errors: string[] = [];

  for (const bucketId of MEDIA_BUCKETS) {
    const bucket = supabase.storage.from(bucketId);
    const extraKey = bucketId === "photos" ? input.photoKey : input.videoKey;
    let names: string[] = [];
    try {
      names = await listedNames(bucket, input.userId);
    } catch (error) {
      errors.push(
        error instanceof Error ? error.message : "Could not list uploaded media.",
      );
    }

    const paths = ownMediaPaths(input.userId, names, extraKey);
    if (paths.length === 0) continue;

    const { error } = await bucket.remove(paths);
    if (error) errors.push(error.message);
  }

  if (errors.length > 0) throw new Error(errors[0]);
}

export async function deleteOwnTherapistProfile(
  supabase: SupabaseClient,
  input: DeleteProfileInput,
): Promise<DeleteProfileResult> {
  if (!deletePhraseMatches(input.confirm)) {
    return { ok: false, message: "Type DELETE to confirm." };
  }

  const { error } = await supabase.rpc("delete_own_therapist_profile", {
    p_confirm: DELETE_PROFILE_PHRASE,
  });
  if (error) return { ok: false, message: error.message };

  try {
    await removeOwnTherapistMedia(supabase, input);
  } catch (error) {
    return {
      ok: true,
      mediaError:
        error instanceof Error
          ? error.message
          : "Could not remove uploaded media.",
    };
  }

  return { ok: true };
}
