import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PhoneFilterBar } from "@/components/search/PhoneFilterBar";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push() {} }),
  useSearchParams: () => new URLSearchParams(),
}));

const filters = {
  tags: [],
  virtual: false,
  inPerson: false,
  state: null,
};

describe("phone find filters", () => {
  it("uses the same pills as the web filters", () => {
    const html = renderToStaticMarkup(
      createElement(PhoneFilterBar, {
        filters,
        matchCount: 2,
        open: null,
        onOpen() {},
      }),
    );
    expect(html).toContain("Where you live");
    expect(html).toContain("Insurance");
    expect(html).toContain("What&#x27;s going on");
    expect(html).toContain("In person or online");
    expect(html).not.toContain("What brings you to therapy?");
    expect(html).not.toContain("Session format");
    expect(html).not.toContain("Years in practice");
    expect(html).not.toContain("Immigration");
    expect(html).toMatch(/data-phone-pills="" class="[^"]*\bflex-wrap\b/);
    expect(html).not.toMatch(/data-phone-pills="" class="[^"]*overflow-x/);
  });
});
