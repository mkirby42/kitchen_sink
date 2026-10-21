import { SPECIALTY_PRESETS } from "@/lib/tags/presets";

/** Desktop Find topic. `specialty` is the stored tag the chip filters on. */
export type FindTopic = {
  plain: string;
  clinical: string;
  specialty: (typeof SPECIALTY_PRESETS)[number];
};

/**
 * Plain-English labels for specialties Find already stores.
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
    plain: "Trouble focusing",
    clinical: "ADHD",
    specialty: "ADHD",
  },
];

/** Mockup topics that do not map onto a stored specialty. Not offered as filters. */
export const UNMAPPED_FIND_TOPICS = [
  "Family or parenting",
  "Burnout or work stress",
  "Drinking or substance use",
  "Food or body image",
  "Who I am",
] as const;

const TOPIC_SPECIALTIES = new Set<string>(
  FIND_TOPICS.map((topic) => topic.specialty),
);

export function isFindTopicSpecialty(label: string) {
  return TOPIC_SPECIALTIES.has(label);
}
