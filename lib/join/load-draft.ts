import type { SupabaseClient } from "@supabase/supabase-js";
import { yearsPracticing } from "@/lib/therapists/display";
import type { JoinDraft } from "./types";

export type JoinDraftRows = {
  email: string;
  profile: {
    name: string | null;
    email: string | null;
    phone: string | null;
    about_me: string | null;
    photo_key: string | null;
    video_key: string | null;
  };
  therapist: {
    credential: string | null;
    start_date_of_practice: string | null;
    open_to_new_clients: boolean;
    virtual_practice: boolean;
    in_person_practice: boolean;
    sliding_scale?: boolean | null;
    sliding_scale_min_cents?: number | null;
    sliding_scale_max_cents?: number | null;
  };
  licenses: { number: string; state: string }[];
  qualifications: { kind: string; label: string }[];
  rates: {
    service_type: string;
    duration_minutes: number;
    price_cents: number;
  }[];
  tags: { kind: string; label: string }[];
  items: { prompt: string; answer: string; tag: string }[];
  location: {
    address: string | null;
    address2: string | null;
    state: string | null;
    zip: string | null;
  } | null;
};

function labelsOf(tags: JoinDraftRows["tags"], kind: string) {
  return tags.filter((tag) => tag.kind === kind).map((tag) => tag.label);
}

export function draftFromRows(rows: JoinDraftRows): JoinDraft {
  const years = yearsPracticing(rows.therapist.start_date_of_practice);
  const outreach = labelsOf(rows.tags, "outreach");

  return {
    name: rows.profile.name ?? "",
    credential: rows.therapist.credential ?? "",
    yearsPracticing: years ?? "",
    education: labelsOf(rows.qualifications, "education"),
    credentials: labelsOf(rows.qualifications, "credential"),
    licenses:
      rows.licenses.length > 0 ? rows.licenses : [{ number: "", state: "" }],
    photoKey: rows.profile.photo_key,
    videoKey: rows.profile.video_key,
    openToNewClients: rows.therapist.open_to_new_clients,
    virtual: rows.therapist.virtual_practice,
    inPerson: rows.therapist.in_person_practice,
    specialties: labelsOf(rows.tags, "specialty"),
    modalities: labelsOf(rows.tags, "modality"),
    insurance: labelsOf(rows.tags, "insurance"),
    identity: labelsOf(rows.tags, "identity"),
    location: rows.location
      ? {
          address: rows.location.address ?? "",
          address2: rows.location.address2 ?? undefined,
          state: rows.location.state ?? "",
          zip: rows.location.zip ?? "",
        }
      : null,
    rates:
      rows.rates.length > 0
        ? rows.rates
        : [
            {
              service_type: "Individual",
              duration_minutes: 50,
              price_cents: 0,
            },
          ],
    slidingScale:
      rows.therapist.sliding_scale === true ||
      rows.therapist.sliding_scale_min_cents != null ||
      rows.therapist.sliding_scale_max_cents != null,
    slidingScaleMinCents: rows.therapist.sliding_scale_min_cents ?? null,
    slidingScaleMaxCents: rows.therapist.sliding_scale_max_cents ?? null,
    cards: rows.items,
    about: rows.profile.about_me ?? "",
    email: rows.profile.email ?? rows.email,
    phone: rows.profile.phone ?? "",
    outreach: outreach.length > 0 ? outreach : ["email"],
    feedback: "",
  };
}

export async function fetchJoinDraft(
  supabase: SupabaseClient,
  userId: string,
  email: string,
): Promise<JoinDraft | null> {
  const [
    profileRes,
    therapistRes,
    licensesRes,
    qualificationsRes,
    ratesRes,
    tagsRes,
    itemsRes,
    locationRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("therapists").select("*").eq("profile_id", userId).maybeSingle(),
    supabase.from("licenses").select("number, state").eq("therapist_id", userId),
    supabase
      .from("qualifications")
      .select("kind, label")
      .eq("therapist_id", userId)
      .order("position", { ascending: true }),
    supabase
      .from("rates")
      .select("service_type, duration_minutes, price_cents")
      .eq("therapist_id", userId)
      .order("price_cents", { ascending: true }),
    supabase.from("tags").select("kind, label").eq("profile_id", userId),
    supabase
      .from("profile_items")
      .select("prompt, answer, tag")
      .eq("therapist_id", userId),
    supabase
      .from("locations")
      .select("address, address2, state, zip")
      .eq("profile_id", userId)
      .maybeSingle(),
  ]);

  if (profileRes.error || therapistRes.error) return null;
  if (!profileRes.data || !therapistRes.data) return null;

  return draftFromRows({
    email,
    profile: profileRes.data,
    therapist: therapistRes.data,
    licenses: licensesRes.data ?? [],
    qualifications: qualificationsRes.data ?? [],
    rates: ratesRes.data ?? [],
    tags: tagsRes.data ?? [],
    items: itemsRes.data ?? [],
    location: locationRes.data,
  });
}
