import { sentenceCasePhrase } from "@/lib/copy/sentence-case";
import { modalityDisplayLabels } from "@/lib/tags/modality-display";
import { directorySpecialties } from "@/lib/tags/presets";
import { officeAddressLines, type ProfileOffice } from "@/lib/therapists/display";
import {
  cashPayOffered,
  givenName,
  practiceFeeRows,
  slidingScaleLabel,
  type PracticeFeeRow,
  type ProfileRate,
  type ProfileReview,
} from "@/lib/therapists/load";

export type FindDetailPublic = {
  givenName: string;
  closed: boolean;
  cashPay: boolean;
  officeLines: string[];
  specialties: string[];
  modalities: string[];
  identity: string[];
  education: string[];
  credentials: string[];
  fees: PracticeFeeRow[];
  about: string | null;
  voiceUrl: string | null;
  voicePrompt: string | null;
  reviews: ProfileReview[];
};

type DetailSource = {
  name?: string;
  givenName?: string;
  inPerson?: boolean;
  insurance?: readonly string[];
  openToNewClients?: boolean;
  credentials?: readonly string[];
  education?: readonly string[];
  specialties?: readonly string[];
  modalities?: readonly string[];
  identity?: readonly string[];
  rates?: readonly ProfileRate[];
  slidingScale?: boolean;
  slidingScaleMinCents?: number | null;
  slidingScaleMaxCents?: number | null;
  office?: ProfileOffice | null;
  about?: string | null;
  voiceUrl?: string | null;
  voicePrompt?: string | null;
  reviews?: readonly ProfileReview[];
};

function filled(values: readonly string[] | undefined) {
  return (values ?? []).map((value) => value.trim()).filter(Boolean);
}

/** Public intake answers for the Find click-in. Empty when the profile did not load. */
export function detailPublicFields(input: {
  name: string;
  inPerson: boolean;
  insurance: readonly string[];
  profile: DetailSource | null;
}): FindDetailPublic {
  const profile = input.profile;
  const sliding = slidingScaleLabel(
    profile?.slidingScale === true ||
      profile?.slidingScaleMinCents != null ||
      profile?.slidingScaleMaxCents != null,
    profile?.slidingScaleMinCents ?? null,
    profile?.slidingScaleMaxCents ?? null,
  );
  const voicePrompt = profile?.voicePrompt?.trim() || null;
  const voiceUrl = profile?.voiceUrl ?? null;

  return {
    givenName: profile?.givenName?.trim() || givenName(input.name),
    closed: profile?.openToNewClients === false,
    cashPay: cashPayOffered(profile?.insurance ?? input.insurance),
    officeLines:
      (profile?.inPerson ?? input.inPerson)
        ? officeAddressLines(profile?.office ?? null)
        : [],
    specialties: directorySpecialties(profile?.specialties ?? []),
    modalities: modalityDisplayLabels([...(profile?.modalities ?? [])]),
    identity: filled(profile?.identity),
    education: filled(profile?.education),
    credentials: filled(profile?.credentials).map(sentenceCasePhrase),
    fees: practiceFeeRows({
      rates: profile?.rates ?? [],
      sliding,
      inNetwork: [],
      cashPay: false,
      superbill: false,
    }),
    about: profile?.about?.trim() || null,
    voiceUrl: voicePrompt && voiceUrl ? voiceUrl : null,
    voicePrompt: voicePrompt && voiceUrl ? voicePrompt : null,
    reviews: (profile?.reviews ?? []).filter((review) => review.status !== "pending"),
  };
}
