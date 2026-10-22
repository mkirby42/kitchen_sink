import type { StackCard } from "@/lib/search/phone-find";
import { supabasePublicConfig } from "@/lib/supabase/env";
import { contactActions, type ContactAction } from "@/lib/therapists/load";

export type PhoneStackExtra = {
  id: string;
  cards: StackCard[];
  licenseStates: string[];
  superbill: boolean;
  contact: ContactAction[];
  rates: {
    service_type: string;
    duration_minutes: number;
    price_cents: number;
  }[];
};

type ItemRow = {
  therapist_id: string;
  prompt: string | null;
  answer: string | null;
  position: number | null;
};

type LicenseRow = { therapist_id: string; state: string | null };
type TherapistRow = { profile_id: string; superbill: boolean | null };
type ProfileRow = {
  id: string;
  email: string | null;
  phone: string | null;
};
type TagRow = { profile_id: string; kind: string; label: string };
type RateRow = {
  therapist_id: string;
  service_type: string;
  duration_minutes: number;
  price_cents: number;
};

function emptyExtra(id: string): PhoneStackExtra {
  return {
    id,
    cards: [],
    licenseStates: [],
    superbill: false,
    contact: [],
    rates: [],
  };
}

/**
 * Profile fields the search card does not return: every conversation card,
 * license states, superbill, contact, and rates. One parallel read, no new table.
 * A failed read leaves that slice empty so the phone stack omits it.
 */
export async function loadPhoneStackExtras(
  ids: readonly string[],
): Promise<PhoneStackExtra[]> {
  if (!ids.length || !supabasePublicConfig()) return [];
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const [items, licenses, therapists, profiles, tags, rates] = await Promise.all([
      supabase
        .from("profile_items")
        .select("therapist_id, prompt, answer, position")
        .in("therapist_id", ids),
      supabase.from("licenses").select("therapist_id, state").in("therapist_id", ids),
      supabase.from("therapists").select("profile_id, superbill").in("profile_id", ids),
      supabase.from("profiles").select("id, email, phone").in("id", ids),
      supabase
        .from("tags")
        .select("profile_id, kind, label")
        .in("profile_id", ids)
        .eq("kind", "outreach"),
      supabase
        .from("rates")
        .select("therapist_id, service_type, duration_minutes, price_cents")
        .in("therapist_id", ids),
    ]);

    const itemRows = items.error ? [] : ((items.data ?? []) as ItemRow[]);
    const licenseRows = licenses.error ? [] : ((licenses.data ?? []) as LicenseRow[]);
    const therapistRows = therapists.error
      ? []
      : ((therapists.data ?? []) as TherapistRow[]);
    const profileRows = profiles.error ? [] : ((profiles.data ?? []) as ProfileRow[]);
    const tagRows = tags.error ? [] : ((tags.data ?? []) as TagRow[]);
    const rateRows = rates.error ? [] : ((rates.data ?? []) as RateRow[]);

    return ids.map((id) => {
      const extra = emptyExtra(id);
      extra.cards = itemRows
        .filter((row) => row.therapist_id === id)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .flatMap((row) => {
          const prompt = row.prompt?.trim() ?? "";
          const answer = row.answer?.trim() ?? "";
          return prompt && answer ? [{ prompt, answer }] : [];
        });
      extra.licenseStates = licenseRows.flatMap((row) => {
        if (row.therapist_id !== id) return [];
        const state = row.state?.trim();
        return state ? [state] : [];
      });
      extra.superbill =
        therapistRows.find((row) => row.profile_id === id)?.superbill === true;
      const profile = profileRows.find((row) => row.id === id);
      const outreach = tagRows
        .filter((row) => row.profile_id === id)
        .map((row) => row.label);
      const actions = contactActions({
        email: profile?.email,
        phone: profile?.phone,
        outreach,
      });
      extra.contact = actions;
      extra.rates = rateRows
        .filter((row) => row.therapist_id === id)
        .sort((a, b) => a.price_cents - b.price_cents);
      return extra;
    });
  } catch {
    return [];
  }
}
