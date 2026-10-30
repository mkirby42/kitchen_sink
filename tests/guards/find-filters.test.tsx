// Product-decision guard. Do not weaken this file to make CI pass.
// See docs/product-decisions.md.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { FindDesktopFilters } from "@/components/search/FindDesktopFilters";
import { PhoneFilterBar } from "@/components/search/PhoneFilterBar";
import type { SearchFilters } from "@/lib/search/rpc";
import type { PhoneSheet } from "@/lib/search/phone-find";

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
  "Seeking personal growth",
  "Trouble focusing",
  "Understanding my moods",
  "My relationship with food or my body",
  "Autism &amp; how my brain works",
  "Testing or getting an evaluation",
];

function phone(filters: SearchFilters, open: PhoneSheet | null) {
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

  it("opens What's going on onto the twelve topics and Show N therapists", () => {
    const html = phone(empty, "topics");
    expect(html).toContain("What would you like help with?");
    expect(html).toContain("You don&#x27;t need the clinical");
    expect(html).toContain("it&#x27;s in small print");
    let at = -1;
    for (const topic of topics) {
      expect(html).toContain(topic);
      const next = html.indexOf(topic);
      expect(next).toBeGreaterThan(at);
      at = next;
    }
    expect(html).toContain("Depression");
    expect(html).toContain("Anxiety, panic disorder");
    expect(html).toContain("Trauma, PTSD");
    expect(html).toContain("Self-discovery, self-awareness");
    expect(html).toContain("ADHD");
    expect(html).toContain("Bipolar disorder, mood disorders");
    expect(html).toContain("Eating disorders, body image");
    expect(html).toContain("Autism, neurodivergence");
    expect(html).toContain("Psychological testing, diagnostic assessment");
    expect(html).toContain("Show 4 therapists");
    expect(html).toContain("Clear all");
    expect(html).toContain("Pick as many as you like. You can change these anytime.");
    expect(html.indexOf("Testing or getting an evaluation")).toBeLessThan(
      html.indexOf("Another specialty"),
    );
    expect(html).toContain("Other");
    expect(html).toContain("Another specialty");
    expect(html).not.toContain("Immigration");
    expect(html).not.toContain("Family or parenting");
    expect(html).not.toContain("Burnout or work stress");
    expect(html).not.toContain("Food or body image");
    expect(html).not.toContain("Who I am");
    expect(html).not.toContain("What brings you to therapy?");
  });

  it("keeps Immigration only so a link that already has it can clear it", () => {
    const html = phone(
      { ...empty, tags: ["Self Discovery", "Immigration"] },
      "topics",
    );
    expect(html).toContain("Seeking personal growth");
    expect(html).toContain("Self-discovery, self-awareness");
    expect(html).toContain("Immigration");
    for (const topic of topics) expect(html).toContain(topic);
    const plain = phone(empty, "topics");
    expect(plain).not.toContain("Immigration");
    expect(plain).toContain("Seeking personal growth");
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
    let at = -1;
    for (const topic of topics) {
      expect(html).toContain(topic);
      const next = html.indexOf(topic);
      expect(next).toBeGreaterThan(at);
      at = next;
    }
    expect(html).toContain("Pick as many as you like. You can change these anytime.");
    expect(html).toContain("Self-discovery, self-awareness");
    expect(html).not.toContain("What brings you to therapy?");
    expect(html).not.toContain("Years in practice");
    expect(html).not.toContain("Immigration");
    expect(html).not.toContain("Food or body image");
    expect(html).not.toContain("Who I am");
    expect(html.indexOf("Testing or getting an evaluation")).toBeLessThan(
      html.indexOf("Another specialty"),
    );
    expect(html).toContain("Other");
    expect(html).toContain("Another specialty");
  });

  it("lists Other last on Insurance, on the phone and on desktop", () => {
    const phoneHtml = phone(empty, "insurance");
    expect(phoneHtml.indexOf("Aetna")).toBeGreaterThan(-1);
    expect(phoneHtml.indexOf("Out-of-network superbill")).toBeLessThan(
      phoneHtml.indexOf("Other"),
    );
    expect(phoneHtml).not.toContain("Another specialty");

    const desktopHtml = renderToStaticMarkup(
      createElement(FindDesktopFilters, {
        matchCount: 4,
        initialOpen: "insurance",
      }),
    );
    const panel = desktopHtml.slice(desktopHtml.indexOf('id="find-insurance"'));
    expect(panel.indexOf("Aetna")).toBeGreaterThan(-1);
    expect(panel.indexOf("Out-of-network superbill")).toBeLessThan(
      panel.indexOf("Other"),
    );
    expect(panel).not.toContain("Another specialty");
    expect(panel).not.toContain("Feeling down or stuck");
  });
});
