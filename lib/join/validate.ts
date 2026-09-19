import { startDateFromYears } from "@/lib/join/dates";
import type { JoinDraft } from "@/lib/join/types";
import { needsSupervisor } from "@/lib/therapists/load";
import {
  CREDENTIALS,
  LICENSE_STATES,
  OUTREACH_OPTIONS,
  RATE_DURATIONS,
  RATE_SERVICE_TYPES,
} from "@/lib/tags/presets";

const CARD_TAGS = new Set([
  "approach",
  "session_vibe",
  "specialty",
  "about",
  "outcome",
  "custom",
]);

const LICENSE_STATE_SET = new Set<string>(LICENSE_STATES);
const CREDENTIAL_SET = new Set<string>(CREDENTIALS);
const RATE_SERVICE_TYPE_SET = new Set<string>(RATE_SERVICE_TYPES);
const RATE_DURATION_SET = new Set<number>(RATE_DURATIONS);
const OUTREACH_OPTION_SET = new Set<string>(OUTREACH_OPTIONS);

function hasDuplicateValues(values: string[]): boolean {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) return true;
    seen.add(value);
  }
  return false;
}

function validateTagList(labels: string[], kind: string, errors: string[]) {
  const trimmed = labels.map((label) => label.trim()).filter(Boolean);
  if (trimmed.length !== labels.length) {
    errors.push(`${kind} labels cannot be empty`);
  }
  if (hasDuplicateValues(trimmed)) {
    errors.push(`${kind} labels must be unique`);
  }
}

export function step1Errors(draft: JoinDraft): string[] {
  const errors: string[] = [];
  const name = draft.name.trim();

  if (!name) {
    errors.push("Name is required");
  }

  if (!CREDENTIAL_SET.has(draft.credential)) {
    errors.push("Credential is required");
  }

  if (draft.yearsPracticing === "") {
    errors.push("Years practicing is required");
  } else if (
    !Number.isInteger(draft.yearsPracticing) ||
    draft.yearsPracticing < 0 ||
    draft.yearsPracticing > 70
  ) {
    errors.push("Years practicing must be an integer from 0 to 70");
  }

  const validLicenses = draft.licenses.filter(
    (license) => license.number.trim() && license.state.trim(),
  );
  if (validLicenses.length === 0) {
    errors.push("At least one state license is required");
  }

  for (const license of validLicenses) {
    if (!LICENSE_STATE_SET.has(license.state)) {
      errors.push(`Invalid license state: ${license.state}`);
    }
  }

  const states = validLicenses.map((license) => license.state);
  if (hasDuplicateValues(states)) {
    errors.push("License states must be unique");
  }

  const requiresSupervisor = needsSupervisor(draft.credential);
  const supervisorName = draft.supervisorName.trim();
  const supervisorLicense = draft.supervisorLicense.trim();

  if (requiresSupervisor) {
    if (!supervisorName || !supervisorLicense) {
      errors.push(
        "Since you selected an associate/pre-licensure credential, please add your supervising clinician's name before submitting.",
      );
    }
  } else if (supervisorName || supervisorLicense) {
    errors.push("Supervisor fields are only used for associate credentials");
  }

  return errors;
}

export function step2Errors(draft: JoinDraft): string[] {
  const errors: string[] = [];

  if (!draft.photoKey?.trim()) {
    errors.push("Photo is required");
  }

  if (!draft.videoKey?.trim()) {
    errors.push("Intro video is required");
  }

  return errors;
}

export function step3Errors(draft: JoinDraft): string[] {
  const errors: string[] = [];

  if (!draft.virtual && !draft.inPerson) {
    errors.push("Select virtual or in-person practice");
  }

  if (draft.inPerson) {
    const location = draft.location;
    if (
      !location ||
      !location.address.trim() ||
      !location.state.trim() ||
      !location.zip.trim()
    ) {
      errors.push("In-person practice requires an address, state, and zip");
    } else if (!LICENSE_STATE_SET.has(location.state)) {
      errors.push(`Invalid location state: ${location.state}`);
    }
  }

  validateTagList(draft.specialties, "Specialty", errors);
  validateTagList(draft.modalities, "Modality", errors);
  validateTagList(draft.insurance, "Insurance", errors);
  validateTagList(draft.identity, "Identity", errors);

  return errors;
}

export function step4Errors(draft: JoinDraft): string[] {
  const errors: string[] = [];

  if (draft.rates.length === 0) {
    errors.push("At least one rate is required");
  }

  for (const rate of draft.rates) {
    if (!RATE_SERVICE_TYPE_SET.has(rate.service_type)) {
      errors.push(`Invalid service type: ${rate.service_type}`);
    }
    if (!RATE_DURATION_SET.has(rate.duration_minutes)) {
      errors.push(`Invalid duration: ${rate.duration_minutes}`);
    }
    if (!Number.isInteger(rate.price_cents) || rate.price_cents < 0) {
      errors.push("Rate price must be a non-negative integer");
    }
  }

  const serviceTypes = draft.rates.map((rate) => rate.service_type);
  if (hasDuplicateValues(serviceTypes)) {
    errors.push("Rate service types must be unique");
  }

  const answeredCards = draft.cards.filter(
    (card) => card.prompt.trim() && card.answer.trim(),
  );
  if (answeredCards.length === 0) {
    errors.push("At least one conversation card is required");
  }

  for (const card of draft.cards) {
    if (!CARD_TAGS.has(card.tag)) {
      errors.push(`Invalid card tag: ${card.tag}`);
    }
  }

  const email = draft.email.trim();
  if (!email || !email.includes("@")) {
    errors.push("Email is required");
  }

  if (hasDuplicateValues(draft.outreach)) {
    errors.push("Outreach options must be unique");
  }

  for (const option of draft.outreach) {
    if (!OUTREACH_OPTION_SET.has(option)) {
      errors.push(`Invalid outreach option: ${option}`);
    }
  }

  if (
    draft.outreach.some((option) => option === "phone" || option === "text") &&
    !draft.phone.trim()
  ) {
    errors.push("Phone is required when phone or text outreach is selected");
  }

  return errors;
}

export function canContinue(
  step: 1 | 2 | 3 | 4,
  draft: JoinDraft,
): boolean {
  switch (step) {
    case 1:
      return step1Errors(draft).length === 0;
    case 2:
      return step2Errors(draft).length === 0;
    case 3:
      return step3Errors(draft).length === 0;
    case 4:
      return step4Errors(draft).length === 0;
  }
}

export function continueHint(step: 1 | 2 | 3 | 4, draft: JoinDraft): string {
  switch (step) {
    case 1: {
      if (!draft.name.trim()) {
        return "Add your name to continue";
      }
      if (
        needsSupervisor(draft.credential) &&
        (!draft.supervisorName.trim() || !draft.supervisorLicense.trim())
      ) {
        return "Add your supervising clinician's name before submitting.";
      }
      const hasLicense = draft.licenses.some(
        (license) => license.number.trim() && license.state.trim(),
      );
      if (!hasLicense) {
        return "Add a state license to continue";
      }
      return "";
    }
    case 2: {
      if (!draft.photoKey?.trim()) {
        return "Add a photo to continue";
      }
      if (!draft.videoKey?.trim()) {
        return "Add an intro video to continue";
      }
      return "";
    }
    case 3: {
      const count =
        draft.specialties.length +
        draft.modalities.length +
        draft.insurance.length +
        draft.identity.length;
      return `${count} tags selected`;
    }
    case 4: {
      const count = draft.cards.filter((card) => card.answer.trim()).length;
      return `${count} of 3 cards`;
    }
  }
}

export function buildJoinPayload(draft: JoinDraft) {
  const allErrors = [
    ...step1Errors(draft),
    ...step2Errors(draft),
    ...step3Errors(draft),
    ...step4Errors(draft),
  ];
  if (allErrors.length > 0) {
    throw new Error("Join draft is incomplete");
  }

  const requiresSupervisor = needsSupervisor(draft.credential);

  return {
    name: draft.name.trim(),
    email: draft.email.trim(),
    phone: draft.phone.trim(),
    about: draft.about.trim(),
    photo_key: draft.photoKey!.trim(),
    video_key: draft.videoKey!.trim(),
    credential: draft.credential,
    start_date: startDateFromYears(Number(draft.yearsPracticing)),
    open_to_new_clients: draft.openToNewClients,
    virtual_practice: draft.virtual,
    in_person_practice: draft.inPerson,
    supervisor_name: requiresSupervisor ? draft.supervisorName.trim() : null,
    supervisor_license: requiresSupervisor
      ? draft.supervisorLicense.trim()
      : null,
    superbill: draft.insurance.some((label) => /superbill/i.test(label)),
    licenses: draft.licenses
      .filter((license) => license.number.trim() && license.state.trim())
      .map((license) => ({
        number: license.number.trim(),
        state: license.state.trim(),
      })),
    rates: draft.rates.map((rate) => ({
      service_type: rate.service_type,
      duration_minutes: rate.duration_minutes,
      price_cents: rate.price_cents,
    })),
    location: draft.inPerson
      ? {
          address: draft.location!.address.trim(),
          address2: draft.location!.address2?.trim() || undefined,
          state: draft.location!.state.trim(),
          zip: draft.location!.zip.trim(),
        }
      : null,
    tags: [
      ...draft.specialties.map((label) => ({
        kind: "specialty",
        label: label.trim(),
      })),
      ...draft.modalities.map((label) => ({
        kind: "modality",
        label: label.trim(),
      })),
      ...draft.insurance.map((label) => ({
        kind: "insurance",
        label: label.trim(),
      })),
      ...draft.identity.map((label) => ({
        kind: "identity",
        label: label.trim(),
      })),
      ...draft.outreach.map((label) => ({
        kind: "outreach",
        label: label.trim(),
      })),
    ],
    items: draft.cards
      .filter((card) => card.prompt.trim() && card.answer.trim())
      .map((card) => ({
        prompt: card.prompt.trim(),
        answer: card.answer.trim(),
        tag: card.tag,
      })),
    feedback: draft.feedback.trim() || null,
  };
}
