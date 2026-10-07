import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { FindFilters } from "@/components/search/FindFilters";
import { eyebrowClass } from "@/components/ui/styles";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push() {} }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("find filters", () => {
  it("asks what brings you to therapy and lists Self Discovery", () => {
    const html = renderToStaticMarkup(createElement(FindFilters));
    expect(html).toContain("What brings you to therapy?");
    expect(html).toContain("Self Discovery");
    expect(html).toContain("Life Transitions");
    expect(html).toContain("Insurance");
    expect(html).not.toContain("Specialties");
    expect(html).not.toContain("Teens");
    expect(html).toContain(eyebrowClass);
    expect(html).not.toContain("uppercase");
    expect(html).not.toContain("px-5 py-2.5");
  });
});
