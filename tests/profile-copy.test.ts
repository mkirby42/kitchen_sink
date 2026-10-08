import { describe, expect, it } from "vitest";
import {
  credentialLine,
  possessive,
  splitAboutLead,
} from "@/components/profile/copy";

describe("profile headings", () => {
  it("uses an s possessive for every name", () => {
    expect(possessive("Travis")).toBe("Travis's");
    expect(possessive("James")).toBe("James's");
    expect(possessive("Chris")).toBe("Chris's");
  });

  it("joins the licensed credential and additional credentials", () => {
    expect(credentialLine("PsyD", ["Licensed Psychologist"])).toBe(
      "PsyD · Licensed Psychologist",
    );
    expect(credentialLine("PsyD", ["PsyD", " Licensed Psychologist "])).toBe(
      "PsyD · Licensed Psychologist",
    );
    expect(credentialLine(null, [])).toBe("");
  });

  it("lifts a short first sentence and keeps the rest as paragraphs", () => {
    const about = [
      "It’s tough to find your path and easy to lose it. I help college students find their way.",
      "I am a Doctor of Clinical Psychology.",
    ].join("\n\n");
    expect(splitAboutLead(about)).toEqual({
      lead: "It’s tough to find your path and easy to lose it.",
      paragraphs: [
        "I help college students find their way.",
        "I am a Doctor of Clinical Psychology.",
      ],
    });
  });

  it("keeps a one-sentence about as the lead", () => {
    expect(splitAboutLead("I help people find their way.")).toEqual({
      lead: "I help people find their way.",
      paragraphs: [],
    });
  });

  it("does not split on a short abbreviation", () => {
    expect(splitAboutLead("Dr. White helps people find a path. Then more.")).toEqual({
      lead: "Dr. White helps people find a path.",
      paragraphs: ["Then more."],
    });
  });
});
