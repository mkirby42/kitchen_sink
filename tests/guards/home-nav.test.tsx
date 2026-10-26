// Product-decision guard. Do not weaken this file to make CI pass.
// See docs/product-decisions.md.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SiteHeader } from "@/components/SiteHeader";
import { HomeHero } from "@/components/home/HomeHero";
import { homePanels } from "@/lib/home";

const nav = vi.hoisted(() => ({ pathname: vi.fn(() => "/") }));

vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname(),
  useRouter: () => ({ push() {}, refresh() {}, replace() {} }),
}));

vi.mock("@/lib/supabase/env", () => ({
  supabasePublicConfig: () => null,
}));

const story = "https://everythingbutkitchensink.beehiiv.com/p/let-s-connect";

describe("homepage guards", () => {
  it("keeps the therapist start and the Gets You card", () => {
    const html = renderToStaticMarkup(createElement(HomeHero, homePanels()));
    expect(html).toContain("Bring everything.");
    expect(html).toContain("kitchen sink.");
    expect(html).toContain("FOR THERAPISTS · FREE");
    expect(html).toContain("Get my profile started →");
    expect(html).toContain("Build it myself from scratch");
    expect(html).toContain('href="/join"');
    expect(html).toContain("How it works");
    expect(html).toContain("01 — We get it started");
    expect(html).toContain("02 — You make it yours");
    expect(html).toContain("03 — You approve it");
    expect(html).toContain("Find a therapist who Gets You.");
    expect(html).toContain('href="/find"');
    expect(html).not.toContain("Meet clients who are ready to bring it all.");
    expect(html).not.toContain("actually fits");
    expect(html).not.toContain("My profile");
    expect(html).not.toContain("Upload therapist media");
    expect(html).not.toContain("Review queue");
  });

  it("does not promote the Beehiiv newsletter on the homepage", () => {
    const html = renderToStaticMarkup(createElement(HomeHero, homePanels()));
    expect(html).not.toContain("From the newsletter");
    expect(html).not.toContain("Why Kitchen Sink?");
    expect(html).not.toContain("The story behind the name and our Why.");
    expect(html).not.toContain("Subscribe to the newsletter");
    expect(html).not.toContain("Read the story");
    expect(html).not.toContain("everythingbutkitchensink.beehiiv.com");
  });
});

describe("header guards", () => {
  it("uses the Caprasimo wordmark and the public links", () => {
    const html = renderToStaticMarkup(createElement(SiteHeader));
    expect(html).toContain("font-logo");
    expect(html).toContain("Kitchen Sink");
    expect(html).toContain("text-gold");
    expect(html).toContain("For Therapists");
    expect(html).toContain('href="/for-therapists"');
    expect(html).toContain("Why Kitchen Sink?");
    expect(html).toContain(`href="${story}"`);
    expect(html).toContain("Therapist log in");
    expect(html).not.toContain("Referrals");
  });

  it("shows Referrals only after the therapist publishes", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    const published = renderToStaticMarkup(
      createElement(SiteHeader, {
        initialNavUser: { id, role: "therapist", hasTherapist: true, published: true },
      }),
    );
    expect(published).toContain("Referrals");
    expect(published).toContain('href="/referrals"');
    expect(published).toContain("Why Kitchen Sink?");
    expect(published).not.toContain("For Therapists");

    const draft = renderToStaticMarkup(
      createElement(SiteHeader, {
        initialNavUser: { id, role: "therapist", hasTherapist: true, published: false },
      }),
    );
    expect(draft).not.toContain("Referrals");
    expect(draft).toContain("Why Kitchen Sink?");
  });
});
