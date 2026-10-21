import { describe, expect, it } from "vitest";
import {
  carouselStatus,
  desktopFormatBadge,
  desktopInsuranceLabels,
  desktopPromptHeading,
  desktopTopicLabels,
  findCredentialLine,
  licensedInLabel,
  plainLabelForSpecialty,
  showTherapistsLabel,
  specialtyForPlainLabel,
} from "@/lib/search/find-desktop";
import { FIND_TOPICS, UNMAPPED_FIND_TOPICS } from "@/lib/tags/plain-language";
import { SPECIALTY_PRESETS } from "@/lib/tags/presets";

describe("desktop find topics", () => {
  it("maps plain-English chips onto stored specialties", () => {
    expect(FIND_TOPICS.map((topic) => topic.plain)).toEqual([
      "Feeling down or stuck",
      "Worry, stress or panic",
      "Something hard happened",
      "Losing someone",
      "Relationship trouble",
      "Big life changes",
      "Trouble focusing",
    ]);
    for (const topic of FIND_TOPICS) {
      expect(SPECIALTY_PRESETS).toContain(topic.specialty);
      expect(specialtyForPlainLabel(topic.plain)).toBe(topic.specialty);
      expect(plainLabelForSpecialty(topic.specialty)).toBe(topic.plain);
    }
    expect(specialtyForPlainLabel("Family or parenting")).toBeNull();
  });

  it("does not offer topics that have no stored specialty", () => {
    expect(UNMAPPED_FIND_TOPICS).toEqual([
      "Family or parenting",
      "Burnout or work stress",
      "Drinking or substance use",
      "Food or body image",
      "Who I am",
    ]);
    const offered = FIND_TOPICS.map((topic) => topic.plain);
    for (const plain of UNMAPPED_FIND_TOPICS) {
      expect(offered).not.toContain(plain);
    }
  });

  it("lists mapped topics first and keeps unmapped specialties visible", () => {
    expect(
      desktopTopicLabels(["ADHD", "Anxiety", "Self Discovery", "Teens"]),
    ).toEqual([
      "Worry, stress or panic",
      "Trouble focusing",
      "Self discovery",
    ]);
  });
});

describe("desktop find card copy", () => {
  const now = new Date("2026-10-21T12:00:00Z");

  it("joins the credential title and years, and drops a missing piece", () => {
    expect(findCredentialLine("PsyD", "2017-01-01", now)).toBe(
      "PsyD · Licensed psychologist · 9 years in practice",
    );
    expect(findCredentialLine("PsyD", "2025-10-21", now)).toBe(
      "PsyD · Licensed psychologist · 1 year in practice",
    );
    expect(findCredentialLine("PhD", null, now)).toBe("PhD");
    expect(findCredentialLine(null, "2016-06-01", now)).toBe(
      "10 years in practice",
    );
    expect(findCredentialLine(null, null, now)).toBeNull();
  });

  it("says Online for virtual and hides a format nobody offers", () => {
    expect(desktopFormatBadge(true, true)).toBe("In person · Online");
    expect(desktopFormatBadge(true, false)).toBe("Online");
    expect(desktopFormatBadge(false, true)).toBe("In person");
    expect(desktopFormatBadge(false, false)).toBeNull();
  });

  it("uses the mockup heading only for the work-best prompt", () => {
    expect(desktopPromptHeading("who I work best with...")).toBe(
      "I WORK BEST WITH...",
    );
    expect(desktopPromptHeading("I work best with...")).toBe(
      "I WORK BEST WITH...",
    );
    expect(desktopPromptHeading("my approach to therapy is...")).toBe(
      "my approach to therapy is...",
    );
    expect(desktopPromptHeading("  ")).toBeNull();
  });

  it("sentence-cases insurance and names a selected license state", () => {
    expect(desktopInsuranceLabels(["Aetna", "Cash Pay Only", "Aetna"])).toEqual([
      "Aetna",
      "Cash pay only",
    ]);
    expect(licensedInLabel("TX")).toBe("Licensed in Texas");
    expect(licensedInLabel(null)).toBeNull();
  });

  it("writes the carousel and show-button counts", () => {
    expect(carouselStatus(0, 3)).toBe(
      "Therapist 1 of 3 who fit what you told us",
    );
    expect(carouselStatus(2, 3)).toBe(
      "Therapist 3 of 3 who fit what you told us",
    );
    expect(carouselStatus(0, 1)).toBe(
      "Therapist 1 of 1 who fits what you told us",
    );
    expect(carouselStatus(0, 0)).toBeNull();
    expect(showTherapistsLabel(null)).toBe("Show therapists");
    expect(showTherapistsLabel(1)).toBe("Show 1 therapist");
    expect(showTherapistsLabel(4)).toBe("Show 4 therapists");
  });
});
