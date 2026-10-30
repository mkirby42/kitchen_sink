import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { FindCarousel } from "@/components/search/FindCarousel";
import { FindDesktopFilters } from "@/components/search/FindDesktopFilters";
import type { SearchFilters } from "@/lib/search/rpc";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push() {} }),
  useSearchParams: () => new URLSearchParams(),
}));

function filters(tags: string[]): SearchFilters {
  return { tags, virtual: false, inPerson: false, state: null };
}

describe("desktop find filters", () => {

  it("opens the plain-English topic panel and the live count", () => {
    const html = renderToStaticMarkup(
      createElement(FindDesktopFilters, { matchCount: 3 }),
    );
    expect(html).not.toContain("Find your therapist");
    expect(html).toContain("Where you live");
    expect(html).toContain("Insurance");
    expect(html).toContain("What&#x27;s going on");
    expect(html).toContain("In person or online");
    expect(html).not.toContain("Years in practice");
    expect(html).toContain("What would you like help with?");
    expect(html).toContain(
      "Pick anything that sounds like you. You don&#x27;t need the clinical term; it&#x27;s in small print in case you know it.",
    );
    expect(html).toContain("Feeling down or stuck");
    expect(html).toContain("Depression");
    expect(html).toContain("Worry, stress or panic");
    expect(html).toContain("Anxiety, panic disorder");
    expect(html).toContain("Something hard happened");
    expect(html).toContain("Trauma, PTSD");
    expect(html).toContain("Losing someone");
    expect(html).toContain("Relationship trouble");
    expect(html).toContain("Big life changes");
    expect(html).toContain("Seeking personal growth");
    expect(html).toContain("Self-discovery, self-awareness");
    expect(html).toContain("Trouble focusing");
    expect(html).toContain("Understanding my moods");
    expect(html).toContain("My relationship with food or my body");
    expect(html).toContain("Autism &amp; how my brain works");
    expect(html).toContain("Testing or getting an evaluation");
    expect(html).toContain("Pick as many as you like. You can change these anytime.");
    expect(html).toContain("Show 3 therapists");
    expect(html).not.toContain("Family or parenting");
    expect(html).not.toContain("Burnout or work stress");
    expect(html).not.toContain("Drinking or substance use");
    expect(html).not.toContain("Food or body image");
    expect(html).not.toContain("Who I am");
    expect(html).not.toContain("What brings you to therapy?");
    expect(html).toContain("Seeking personal growth");
    expect(html).not.toContain("Immigration");
    expect(html).toContain("Other");
    expect(html).toContain("Another specialty");
    expect(html.indexOf("Testing or getting an evaluation")).toBeLessThan(
      html.indexOf("Another specialty"),
    );
  });

  it("lists Other after the insurance presets", () => {
    const html = renderToStaticMarkup(
      createElement(FindDesktopFilters, {
        matchCount: 3,
        initialOpen: "insurance",
      }),
    );
    const panel = html.slice(html.indexOf('id="find-insurance"'));
    expect(panel.indexOf("Out-of-network superbill")).toBeLessThan(
      panel.indexOf("Other"),
    );
    expect(panel).not.toContain("Another specialty");
  });

  it("selects insurance Other and topic Other independently", () => {
    const topics = renderToStaticMarkup(
      createElement(FindDesktopFilters, {
        matchCount: 1,
        initialOpen: "topics",
        filters: filters(["Other"]),
      }),
    );
    const topicAt = topics.indexOf("Another specialty");
    expect(topics.slice(topicAt - 500, topicAt)).toContain('aria-pressed="false"');

    const insurance = renderToStaticMarkup(
      createElement(FindDesktopFilters, {
        matchCount: 1,
        initialOpen: "insurance",
        filters: filters(["Other topic"]),
      }),
    );
    const insuranceAt = insurance.indexOf("Out-of-network superbill");
    const otherAt = insurance.indexOf("Other", insuranceAt);
    expect(insurance.slice(otherAt - 500, otherAt)).toContain('aria-pressed="false"');

    const both = renderToStaticMarkup(
      createElement(FindDesktopFilters, {
        matchCount: 1,
        initialOpen: "topics",
        filters: filters(["Other", "Other topic"]),
      }),
    );
    const bothAt = both.indexOf("Another specialty");
    expect(both.slice(bothAt - 500, bothAt)).toContain('aria-pressed="true"');
  });

  it("keeps Immigration when the address already has it, and lists personal growth", () => {
    const html = renderToStaticMarkup(
      createElement(FindDesktopFilters, {
        matchCount: 1,
        filters: filters(["Self Discovery", "Immigration", "Anxiety"]),
      }),
    );
    expect(html).toContain("Seeking personal growth");
    expect(html).toContain("Immigration");
    expect(html).toContain("Worry, stress or panic");
    expect(html).toContain("Show 1 therapist");
    const plain = renderToStaticMarkup(
      createElement(FindDesktopFilters, { matchCount: 1 }),
    );
    expect(plain).toContain("Seeking personal growth");
    expect(plain).not.toContain("Immigration");
  });

  it("says Show therapists when the count is unknown", () => {
    const html = renderToStaticMarkup(
      createElement(FindDesktopFilters, { matchCount: null }),
    );
    expect(html).toContain("Show therapists");
    expect(html).not.toContain("Show null");
  });
});

describe("find carousel", () => {
  it("starts on the first therapist and offers previous, next, and dots", () => {
    const html = renderToStaticMarkup(
      createElement(FindCarousel, {
        slides: [
          { id: "a", card: "Ada Lovelace" },
          { id: "b", card: "Bea Smith" },
        ],
      }),
    );
    expect(html).toContain("Therapist 1 of 2 who fit what you told us");
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain("Bea Smith");
    expect(html).toContain('aria-label="Previous therapist"');
    expect(html).toContain('aria-label="Next therapist"');
    expect(html).toContain('aria-label="Therapist 1"');
    expect(html).toContain('aria-label="Therapist 2"');
  });
});
