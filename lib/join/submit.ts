import type { SupabaseClient } from "@supabase/supabase-js";
import type { buildJoinPayload } from "@/lib/join/validate";

type JoinPayload = ReturnType<typeof buildJoinPayload>;

export function toRpcArgs(payload: JoinPayload) {
  return {
    p_name: payload.name,
    p_email: payload.email,
    p_phone: payload.phone,
    p_about: payload.about,
    p_photo_key: payload.photo_key,
    p_video_key: payload.video_key,
    p_credential: payload.credential,
    p_start_date: payload.start_date,
    p_open_to_new_clients: payload.open_to_new_clients,
    p_virtual: payload.virtual_practice,
    p_in_person: payload.in_person_practice,
    p_supervisor_name: payload.supervisor_name,
    p_supervisor_license: payload.supervisor_license,
    p_superbill: payload.superbill,
    p_licenses: payload.licenses,
    p_rates: payload.rates,
    p_location: payload.location,
    p_tags: payload.tags,
    p_items: payload.items,
    p_feedback: payload.feedback,
  };
}

export async function uploadJoinMedia(
  supabase: SupabaseClient,
  userId: string,
  kind: "photo" | "video",
  file: File,
) {
  const bucket = kind === "photo" ? "photos" : "videos";
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${userId}/${kind}-${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type,
  });

  if (error) throw error;
  return path;
}
