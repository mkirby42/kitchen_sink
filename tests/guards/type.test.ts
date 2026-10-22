// Product-decision guard. Do not weaken this file to make CI pass.
// See docs/product-decisions.md.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { cardAnswerClass, cardSubtitleClass, softTagClass } from "@/components/ui/styles";

describe("public type guards", () => {
  it("uses Fraunces for answers, DM Sans for labels, and wrapping tag pills", () => {
    expect(cardAnswerClass).toContain("font-display");
    expect(cardSubtitleClass).toContain("font-sans");
    expect(softTagClass).toContain("break-words");
    expect(softTagClass).toContain("whitespace-normal");
  });

  it("loads Fraunces, DM Sans, and Caprasimo as the wordmark only", () => {
    const layout = readFileSync("app/layout.tsx", "utf8");
    const css = readFileSync("app/globals.css", "utf8");
    expect(layout).toContain("Caprasimo");
    expect(layout).toContain("DM_Sans");
    expect(layout).toContain("Fraunces");
    expect(layout).not.toContain("Nunito");
    expect(css).toContain("--font-display: var(--font-fraunces)");
    expect(css).toContain("--font-sans: var(--font-dm-sans)");
    expect(css).toContain("--font-logo: var(--font-caprasimo)");
    expect(css).toContain("Caprasimo is the wordmark only");
  });
});
