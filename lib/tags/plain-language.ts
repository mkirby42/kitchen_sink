import { FIND_TOPIC_OTHER, SPECIALTY_PRESETS } from "@/lib/tags/presets";

/** Desktop Find topic. `specialty` is the stored tag the chip filters on. */
export type FindTopic = {
  plain: string;
  clinical: string;
  specialty: (typeof SPECIALTY_PRESETS)[number];
};

/**
 * Plain-English labels for specialties Find stores.
 * Filtering still writes the specialty string, not the plain label.
 * Topics with no stored specialty are intentionally absent.
 */
export const FIND_TOPICS: readonly FindTopic[] = [
  {
    plain: "Feeling down or stuck",
    clinical: "Depression",
    specialty: "Depression",
  },
  {
    plain: "Worry, stress or panic",
    clinical: "Anxiety, panic disorder",
    specialty: "Anxiety",
  },
  {
    plain: "Something hard happened",
    clinical: "Trauma, PTSD",
    specialty: "Trauma & PTSD",
  },
  {
    plain: "Losing someone",
    clinical: "Grief and loss",
    specialty: "Grief & Loss",
  },
  {
    plain: "Relationship trouble",
    clinical: "Couples, relationship issues",
    specialty: "Couples & Relationships",
  },
  {
    plain: "Big life changes",
    clinical: "Life transitions",
    specialty: "Life Transitions",
  },
  {
    plain: "Seeking personal growth",
    clinical: "Self-discovery, self-awareness",
    specialty: "Self Discovery",
  },
  {
    plain: "Trouble focusing",
    clinical: "ADHD",
    specialty: "ADHD",
  },
  {
    plain: "Understanding my moods",
    clinical: "Bipolar disorder, mood disorders",
    specialty: "Bipolar & Mood Disorders",
  },
  {
    plain: "My relationship with food or my body",
    clinical: "Eating disorders, body image",
    specialty: "Eating Disorders & Body Image",
  },
  {
    plain: "Autism & how my brain works",
    clinical: "Autism, neurodivergence",
    specialty: "Autism & Neurodivergence",
  },
  {
    plain: "Testing or getting an evaluation",
    clinical: "Psychological testing, diagnostic assessment",
    specialty: "Psychological Testing & Assessment",
  },
];

/** Mockup topics that do not map onto a stored specialty. Not offered as filters. */
export const UNMAPPED_FIND_TOPICS = [
  "Family or parenting",
  "Burnout or work stress",
  "Drinking or substance use",
] as const;

/** Line under the What's going on list, on the phone, on desktop, and without JavaScript. */
export const FIND_TOPIC_HELPER =
  "Pick as many as you like. You can change these anytime.";

const TOPIC_SPECIALTIES = new Set<string>(
  FIND_TOPICS.map((topic) => topic.specialty),
);

/** Last What's going on option. `tag` is the address marker, not a join preset. */
export const FIND_TOPIC_OTHER_OPTION = {
  plain: "Other",
  clinical: "Another specialty",
  tag: FIND_TOPIC_OTHER,
} as const;

export function isFindTopicSpecialty(label: string) {
  return TOPIC_SPECIALTIES.has(label);
}

/** A named Find topic, or the Find-only Other marker. */
export function isSelectedFindTopic(tag: string) {
  return isFindTopicSpecialty(tag) || tag === FIND_TOPIC_OTHER;
}
