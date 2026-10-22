// Product-decision guard. Do not weaken this file to make CI pass.
// See docs/product-decisions.md.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { FindDesktopFilters } from "@/components/search/FindDesktopFilters";
import { PhoneFilterBar } from "@/components/search/PhoneFilterBar";
import type { SearchFilters } from "@/lib/search/rpc";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push() {} }),
  useSearchParams: () => new URLSearchParams(),
}));

const empty: SearchFilters = {
  tags: [],
  virtual: false,
  inPerson: false,
  state: null,
};

const topics = [
  "Feeling down or stuck",
  "Worry, stress or panic",
  "Something hard happened",
  "Losing someone",
  "Relationship trouble",
  "Big life changes",
  "Trouble focusing",
];

function phone(filters: SearchFilters, open: "topics" | null) {
  return renderToStaticMarkup(
    createElement(PhoneFilterBar, {
      filters,
      matchCount: 4,
      open,
      onOpen() {},
    }),
  );
}

describe("find filter guards", () => {
  it("uses the same four pills on the phone, wrapping, with no years filter", () => {
    const html = phone(empty, null);
    const where = html.indexOf("Where you live");
    const insurance = html.indexOf("Insurance");
    const going = html.indexOf("What&#x27;s going on");
    const format = html.indexOf("In person or online");
    expect(where).toBeGreaterThan(-1);
    expect(insurance).toBeGreaterThan(where);
    expect(going).toBeGreaterThan(insurance);
    expect(format).toBeGreaterThan(going);
    expect(html).toMatch(/data-phone-pills="" class="[^"]*\bflex-wrap\b/);
    expect(html).not.toMatch(/data-phone-pills="" class="[^"]*overflow-x/);
    expect(html).not.toContain("Years in practice");
    expect(html).not.toContain("What brings you to therapy?");
  });

  it("opens What's going on onto the seven topics and Show N therapists", () => {
    const html = phone(empty, "topics");
    expect(html).toContain("What would you like help with?");
    expect(html).toContain("You don&#x27;t need the clinical");
    expect(html).toContain("it&#x27;s in small print");
    for (const topic of topics) expect(html).toContain(topic);
    expect(html).toContain("Depression");
    expect(html).toContain("Anxiety, panic disorder");
    expect(html).toContain("Trauma, PTSD");
    expect(html).toContain("ADHD");
    expect(html).toContain("Show 4 therapists");
    expect(html).toContain("Clear all");
    expect(html).not.toContain("Self discovery");
    expect(html).not.toContain("Self Discovery");
    expect(html).not.toContain("Immigration");
    expect(html).not.toContain("Family or parenting");
    expect(html).not.toContain("Burnout or work stress");
    expect(html).not.toContain("What brings you to therapy?");
  });

  it("keeps Self Discovery and Immigration only so a link that already has them can clear them", () => {
    const html = phone(
      { ...empty, tags: ["Self Discovery", "Immigration"] },
      "topics",
    );
    expect(html).toContain("Self discovery");
    expect(html).toContain("Immigration");
    for (const topic of topics) expect(html).toContain(topic);
  });

  it("uses the same What's going on panel on desktop", () => {
    const html = renderToStaticMarkup(
      createElement(FindDesktopFilters, { matchCount: 4 }),
    );
    const where = html.indexOf("Where you live");
    const insurance = html.indexOf("Insurance");
    const going = html.indexOf("What&#x27;s going on");
    const format = html.indexOf("In person or online");
    expect(where).toBeGreaterThan(-1);
    expect(insurance).toBeGreaterThan(where);
    expect(going).toBeGreaterThan(insurance);
    expect(format).toBeGreaterThan(going);
    expect(html).toContain("What would you like help with?");
    expect(html).toContain("Show 4 therapists");
    for (const topic of topics) expect(html).toContain(topic);
    expect(html).not.toContain("What brings you to therapy?");
    expect(html).not.toContain("Years in practice");
    expect(html).not.toContain("Self discovery");
    expect(html).not.toContain("Immigration");
  });
});
