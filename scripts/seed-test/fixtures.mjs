/** Fake therapists for the test project. Ids stay put so a re-run replaces them. */

export const PASSWORD = "sample-seed-only";
export const PRICE_CENTS = 18700;
export const PRICE_LABEL = "$187";
export const OFFICE_STREET = "418 Sample Street";
export const OFFICE_REGION = "TX 78704";
export const LICENSE_NUMBER = "38047";
export const LICENSE_LINE = "Licensed by State of Texas / 38047";
export const VOICE_TITLE = "A short sample voice prompt";
export const WORK_PROMPT = "I work best with...";
export const WORK_ANSWER = "Adults who want a practical session.";
export const PHONE = "(512) 555-0148";

const OPEN = [
  ["01", "ada", "Ada Sample", "video", "Anxiety"],
  ["02", "bea", "Bea Sample", "voice", "Anxiety"],
  ["03", "cora", "Cora Sample", "video", "Depression"],
  ["04", "dana", "Dana Sample", "video", "Depression"],
  ["05", "eden", "Eden Sample", "video", "Depression"],
  ["06", "fran", "Fran Sample", "video", "Depression"],
  ["07", "gia", "Gia Sample", "video", "Depression"],
  ["08", "hana", "Hana Sample", "video", "Depression"],
  ["09", "ira", "Ira Sample", "video", "Depression"],
];

function person(n, slug, name, media, specialty, published, open) {
  return {
    id: `a11ce000-0000-4000-8000-0000000000${n}`,
    slug,
    name,
    email: `${slug}.sample@example.test`,
    media,
    specialty,
    published,
    open,
  };
}

export const openTherapists = OPEN.map(([n, slug, name, media, specialty]) =>
  person(n, slug, name, media, specialty, true, true),
);

export const draft = person("0a", "draft", "Draft Sample", "none", "Depression", false, true);
export const closed = person("0b", "closed", "Closed Sample", "video", "Anxiety", true, false);

export const ada = openTherapists[0];
export const bea = openTherapists[1];
export const ira = openTherapists[8];
export const everyone = [...openTherapists, draft, closed];

export function joinArgs(sample) {
  const video = sample.media === "video";
  const voice = sample.media === "voice";
  const photo = sample.media !== "none";
  return {
    p_name: sample.name,
    p_email: sample.email,
    p_phone: PHONE,
    p_about: `${sample.name.split(" ")[0]} keeps sessions practical. This sample about is not a real biography.`,
    p_photo_key: photo ? `${sample.id}/photo.jpg` : null,
    p_video_key: video ? `${sample.id}/intro.mp4` : null,
    p_credential: "PsyD",
    p_start_date: "2014-06-01",
    p_open_to_new_clients: sample.open,
    p_virtual: true,
    p_in_person: true,
    p_superbill: false,
    p_licenses: [{ number: LICENSE_NUMBER, state: "TX" }],
    p_rates: [
      {
        service_type: "Individual",
        duration_minutes: 50,
        price_cents: PRICE_CENTS,
      },
    ],
    p_location: {
      address: OFFICE_STREET,
      address2: null,
      state: "TX",
      zip: "78704",
    },
    p_tags: [
      { kind: "specialty", label: sample.specialty },
      { kind: "modality", label: "CBT" },
      { kind: "insurance", label: "Aetna" },
      { kind: "outreach", label: "email" },
      { kind: "outreach", label: "phone" },
      { kind: "outreach", label: "text" },
    ],
    p_items: [
      { prompt: WORK_PROMPT, answer: WORK_ANSWER, tag: "about" },
      {
        prompt: "a session with me feels like...",
        answer: "Unhurried and direct.",
        tag: "session_vibe",
      },
      {
        prompt: "my approach to therapy is...",
        answer: "Collaborative and concrete.",
        tag: "approach",
      },
    ],
    p_qualifications: [
      { kind: "education", label: "Sample State University", position: 0 },
    ],
    p_feedback: null,
    p_sliding_scale: true,
    p_sliding_scale_min_cents: null,
    p_sliding_scale_max_cents: null,
    p_publish: sample.published,
    p_voice_key: voice ? `${sample.id}/prompt.wav` : null,
    p_voice_prompt: voice ? VOICE_TITLE : null,
  };
}
