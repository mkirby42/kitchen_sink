import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TagPills } from "@/components/profile/TagPills";
import {
  cardAnswerClass,
  cardSubtitleClass,
  profilePageHeadingClass,
  profileSectionHeadingClass,
} from "@/components/ui/styles";
import {
  sentenceCasePhrase,
  sentenceCaseSegments,
} from "@/lib/copy/sentence-case";

describe("sentence case", () => {
  it("lowercases the rest of a label and keeps acronyms", () => {
    expect(sentenceCasePhrase("Life Transitions")).toBe("Life transitions");
    expect(sentenceCasePhrase("Trauma & PTSD")).toBe("Trauma & PTSD");
    expect(sentenceCasePhrase("Couples & Relationships")).toBe(
      "Couples & relationships",
    );
    expect(sentenceCasePhrase("Cognitive Behavioral Therapy (CBT)")).toBe(
      "Cognitive behavioral therapy (CBT)",
    );
    expect(sentenceCasePhrase("Attachment-Based")).toBe("Attachment-based");
    expect(sentenceCasePhrase("LGBTQ+")).toBe("LGBTQ+");
    expect(sentenceCaseSegments("PsyD · Licensed Psychologist")).toBe(
      "PsyD · Licensed psychologist",
    );
  });
});

describe("public type scale", () => {
  it("uses Fraunces for headings and answers, and the mobile sizes", () => {
    expect(profilePageHeadingClass).toContain("font-display");
    expect(profilePageHeadingClass).toContain("text-[30px]");
    expect(profilePageHeadingClass).toContain("md:text-[36px]");
    expect(profilePageHeadingClass).toContain("md:leading-[42px]");
    expect(profilePageHeadingClass).toContain("font-medium");
    expect(profilePageHeadingClass).toContain("text-heading");
    expect(profileSectionHeadingClass).toContain("text-[22px]");
    expect(profileSectionHeadingClass).toContain("md:text-[26px]");
    expect(profileSectionHeadingClass).toContain("md:leading-[32px]");
    expect(cardSubtitleClass).toContain("text-[16px]");
    expect(cardSubtitleClass).toContain("md:text-[18px]");
    expect(cardSubtitleClass).toContain("tracking-[0.01em]");
    expect(cardAnswerClass).toContain("font-display");
    expect(cardAnswerClass).toContain("text-[20px]");
    expect(cardAnswerClass).toContain("leading-[30px]");
    expect(cardAnswerClass).toContain("md:text-[22px]");
    expect(cardAnswerClass).toContain("md:leading-[32px]");
    expect(cardAnswerClass).toContain("font-normal");
  });
});

describe("tag pills", () => {
  it("shows six labels and a more pill", () => {
    const html = renderToStaticMarkup(
      createElement(TagPills, {
        labels: ["One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight"],
      }),
    );
    expect(html).toContain(">Six<");
    expect(html).not.toContain(">Seven<");
    expect(html).toContain("+2 more");
    expect(html).toContain("bg-pill-bg");
    expect(html).toContain("text-pill");
  });
});
