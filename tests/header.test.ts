import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SiteHeader } from "@/components/SiteHeader";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push() {}, refresh() {}, replace() {} }),
}));

vi.mock("@/lib/supabase/env", () => ({
  supabasePublicConfig: () => null,
}));

describe("site header", () => {
  it("omits Interest for a signed-in therapist", () => {
    const html = renderToStaticMarkup(
      createElement(SiteHeader, {
        initialNavUser: {
          id: "11111111-1111-4111-8111-111111111111",
          role: "therapist",
        },
      }),
    );
    expect(html).toContain("Find a Therapist");
    expect(html).toContain("My profile");
    expect(html).not.toContain("Interest");
    expect(html).not.toContain("/matches");
  });

  it("omits Interest for a signed-out visitor", () => {
    const html = renderToStaticMarkup(
      createElement(SiteHeader, { initialNavUser: null }),
    );
    expect(html).toContain("Find a Therapist");
    expect(html).toContain("Join as a Therapist");
    expect(html).not.toContain("Interest");
    expect(html).not.toContain("/matches");
  });
});
