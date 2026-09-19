import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabasePublicConfig } from "@/lib/supabase/env";
import {
  formatUsdFromCents,
  storagePublicUrl,
  yearsPracticing,
} from "./display";
import { needsSupervisor } from "./credential";
import { resolveTherapistId } from "./ids";

export { needsSupervisor } from "./credential";

export type ProfileLicense = {
  number: string;
  state: string;
};

export type ProfileRate = {
  service_type: string;
  duration_minutes: number;
  price_cents: number;
};

export type ProfileTag = {
  kind: string;
  label: string;
};

export type ProfileCard = {
  prompt: string;
  answer: string;
  tag: string;
};

export type ProfileReview = {
  stars: number | null;
  body: string | null;
  session_format: string | null;
  duration_label: string | null;
  reviewer_name: string | null;
};

export type ContactAction = {
  kind: "email" | "phone" | "text";
  label: string;
  href: string;
};

export type TherapistProfileData = {
  id: string;
  name: string;
  givenName: string;
  email: string | null;
  phone: string | null;
  about: string | null;
  photoUrl: string | null;
  videoUrl: string | null;
  credential: string | null;
  years: number | null;
  virtual: boolean;
  inPerson: boolean;
  supervisorName: string | null;
  supervisorLicense: string | null;
  showSupervisor: boolean;
  slidingScaleMinCents: number | null;
  slidingScaleMaxCents: number | null;
  superbill: boolean;
  licenses: ProfileLicense[];
  rates: ProfileRate[];
  tags: ProfileTag[];
  specialties: string[];
  modalities: string[];
  insurance: string[];
  inNetwork: string[];
  identity: string[];
  cards: ProfileCard[];
  reviews: ProfileReview[];
  contact: ContactAction[];
};

const SUPERBILL_LABEL = "out-of-network superbill";

export function givenName(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts[0]?.replace(/\./g, "").toLowerCase() === "dr") {
    return parts[1] ?? parts[0];
  }
  return parts[0] ?? name;
}

export function licenseLine(licenses: ProfileLicense[]) {
  if (licenses.length === 0) return null;
  return licenses
    .map((license, index) => {
      const body = `#${license.number} (${license.state})`;
      return index === 0 ? `Lic. ${body}` : body;
    })
    .join(" · ");
}

export function telHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `tel:+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `tel:+${digits}`;
  return `tel:${digits}`;
}

export function smsHref(phone: string) {
  return telHref(phone).replace(/^tel:/, "sms:");
}

export function contactActions(input: {
  email: string | null | undefined;
  phone: string | null | undefined;
  outreach: string[];
}): ContactAction[] {
  const wanted = new Set(input.outreach.map((item) => item.toLowerCase()));
  const actions: ContactAction[] = [];
  if (wanted.has("email") && input.email) {
    actions.push({
      kind: "email",
      label: "Email",
      href: `mailto:${input.email}`,
    });
  }
  if (wanted.has("phone") && input.phone) {
    actions.push({
      kind: "phone",
      label: "Call",
      href: telHref(input.phone),
    });
  }
  if (wanted.has("text") && input.phone) {
    actions.push({
      kind: "text",
      label: "Text",
      href: smsHref(input.phone),
    });
  }
  return actions;
}

export type ConsultBookAction = {
  kind: "consult" | "book";
  label: string;
  href: string;
};

/** Screenshot CTAs: still mailto/tel, never a calendar. */
export function consultBookActions(
  contact: ContactAction[],
): ConsultBookAction[] {
  const email = contact.find((item) => item.kind === "email");
  const phone =
    contact.find((item) => item.kind === "phone") ??
    contact.find((item) => item.kind === "text");
  const actions: ConsultBookAction[] = [];
  if (email) {
    actions.push({
      kind: "consult",
      label: "Free Consult",
      href: email.href,
    });
  }
  if (phone) {
    actions.push({
      kind: "book",
      label: "Book a Session",
      href: phone.href,
    });
  }
  return actions;
}

export function inNetworkInsurance(labels: string[]) {
  return labels.filter(
    (label) =>
      label.toLowerCase() !== SUPERBILL_LABEL &&
      label.toLowerCase() !== "cash pay only",
  );
}

export function hasSuperbill(labels: string[], flag: boolean) {
  return (
    flag || labels.some((label) => label.toLowerCase() === SUPERBILL_LABEL)
  );
}

export function reviewAverage(stars: number[]) {
  if (stars.length === 0) return null;
  const mean = stars.reduce((sum, n) => sum + n, 0) / stars.length;
  return Math.round(mean * 10) / 10;
}

export function formatLabel(virtual: boolean, inPerson: boolean) {
  if (virtual && inPerson) return "Virtual & In-Person";
  if (virtual) return "Virtual";
  if (inPerson) return "In-Person";
  return null;
}

export function slidingScaleLabel(
  minCents: number | null,
  maxCents: number | null,
) {
  const min = formatUsdFromCents(minCents);
  const max = formatUsdFromCents(maxCents);
  if (min && max) return `${min}-${max.replace("$", "")}`;
  return min ?? max;
}

type ReviewRow = {
  stars_avg: number | string | null;
  body: string | null;
  session_format: string | null;
  duration_label: string | null;
  patient_hidden?: boolean | null;
}

function labelsOf(tags: ProfileTag[], kind: string) {
  return tags.filter((tag) => tag.kind === kind).map((tag) => tag.label);
}

export async function fetchTherapistProfile(
  supabase: SupabaseClient,
  rawId: string,
): Promise<TherapistProfileData | null> {
  const id = resolveTherapistId(rawId);

  const [
    profileRes,
    therapistRes,
    licensesRes,
    ratesRes,
    tagsRes,
    itemsRes,
    reviewsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
    supabase.from("therapists").select("*").eq("profile_id", id).maybeSingle(),
    supabase.from("licenses").select("number, state").eq("therapist_id", id),
    supabase
      .from("rates")
      .select("service_type, duration_minutes, price_cents")
      .eq("therapist_id", id)
      .order("price_cents", { ascending: true }),
    supabase.from("tags").select("kind, label").eq("profile_id", id),
    supabase
      .from("profile_items")
      .select("prompt, answer, tag")
      .eq("therapist_id", id),
    supabase
      .from("reviews")
      .select(
        "stars_avg, body, session_format, duration_label, patient_hidden",
      )
      .eq("therapist_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (profileRes.error || therapistRes.error) return null;

  const profile = profileRes.data;
  const therapist = therapistRes.data;
  if (!profile || !therapist) return null;
  if (profile.role !== "therapist") return null;
  if (!therapist.open_to_new_clients) return null;

  const tags = (tagsRes.data ?? []) as ProfileTag[];
  const outreach = labelsOf(tags, "outreach");
  const insurance = labelsOf(tags, "insurance");
  const reviews = ((reviewsRes.data ?? []) as ReviewRow[])
    .filter((row) => !row.patient_hidden)
    .map((row) => ({
      stars: row.stars_avg == null ? null : Number(row.stars_avg),
      body: row.body,
      session_format: row.session_format,
      duration_label: row.duration_label,
      reviewer_name: null,
    }));

  return {
    id,
    name: profile.name,
    givenName: givenName(profile.name),
    email: profile.email,
    phone: profile.phone,
    about: profile.about_me,
    photoUrl: storagePublicUrl("photos", profile.photo_key),
    videoUrl: storagePublicUrl("videos", profile.video_key),
    credential: therapist.credential,
    years: yearsPracticing(therapist.start_date_of_practice),
    virtual: therapist.virtual_practice,
    inPerson: therapist.in_person_practice,
    supervisorName: therapist.supervisor_name,
    supervisorLicense: therapist.supervisor_license,
    showSupervisor: needsSupervisor(therapist.credential),
    slidingScaleMinCents: therapist.sliding_scale_min_cents,
    slidingScaleMaxCents: therapist.sliding_scale_max_cents,
    superbill: therapist.superbill,
    licenses: (licensesRes.data ?? []) as ProfileLicense[],
    rates: (ratesRes.data ?? []) as ProfileRate[],
    tags,
    specialties: labelsOf(tags, "specialty"),
    modalities: labelsOf(tags, "modality"),
    insurance,
    inNetwork: inNetworkInsurance(insurance),
    identity: labelsOf(tags, "identity"),
    cards: (itemsRes.data ?? []) as ProfileCard[],
    reviews,
    contact: contactActions({
      email: profile.email,
      phone: profile.phone,
      outreach,
    }),
  };
}

export const loadTherapistProfile = cache(async (rawId: string) => {
  if (!supabasePublicConfig()) return null;
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    return await fetchTherapistProfile(supabase, rawId);
  } catch {
    return null;
  }
});
