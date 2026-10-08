import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SiteHeader, siteNavHidden } from "@/components/SiteHeader";
import { routes } from "@/lib/routes";

const nav = vi.hoisted(() => ({
  pathname: vi.fn(() => "/"),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname(),
  useRouter: () => ({ push() {}, refresh() {}, replace() {} }),
}));

vi.mock("@/lib/supabase/env", () => ({
  supabasePublicConfig: () => null,
}));

describe("site header visibility", () => {
  it("keeps the header on account pages and therapist profiles, and hides it on join steps", () => {
    expect(siteNavHidden("/join", null)).toBe(false);
    expect(siteNavHidden("/forgot-password", null)).toBe(false);
    expect(siteNavHidden("/reset-password", { role: "admin" })).toBe(false);
    expect(siteNavHidden("/profile-deleted", null)).toBe(false);
    expect(siteNavHidden("/admin/media", null)).toBe(false);
    expect(siteNavHidden("/join", { role: "patient" })).toBe(false);
    expect(siteNavHidden("/join", { role: "therapist" })).toBe(true);
    expect(siteNavHidden("/join", { role: "admin" })).toBe(true);
    expect(siteNavHidden("/join", { role: null })).toBe(true);
    expect(siteNavHidden("/t/abc", null)).toBe(false);
    expect(siteNavHidden("/t/abc", { role: "therapist" })).toBe(false);
  });
});

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
    expect(html).toContain("Why Kitchen Sink?");
    expect(html).toContain(
      'href="https://everythingbutkitchensink.beehiiv.com/p/two-feet-in-the-kitchen-sink-5219f599263b7fcd"',
    );
    expect(html).toContain("My profile");
    expect(html).toContain(
      `href="${routes.therapist("11111111-1111-4111-8111-111111111111")}"`,
    );
    expect(html).not.toContain("For Therapists");
    expect(html).not.toContain("Therapist log in");
    expect(html).not.toContain("Join as a Therapist");
    expect(html).not.toContain("Interest");
    expect(html).not.toContain("/matches");
  });

  it("lets an admin join as a therapist and keeps Uploads", () => {
    const html = renderToStaticMarkup(
      createElement(SiteHeader, {
        initialNavUser: {
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
          role: "admin",
        },
      }),
    );
    expect(html).toContain("For Therapists");
    expect(html).toContain('href="/join"');
    expect(html).toContain("Uploads");
    expect(html).toContain("Reviews");
    expect(html).toContain('href="/admin/reviews"');
    expect(html).not.toContain("Therapist log in");
    expect(html).not.toContain("My profile");
  });

  it("shows My profile for an admin who already published one", () => {
    const html = renderToStaticMarkup(
      createElement(SiteHeader, {
        initialNavUser: {
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
          role: "admin",
          hasTherapist: true,
        },
      }),
    );
    expect(html).toContain("For Therapists");
    expect(html).toContain("My profile");
    expect(html).toContain(
      `href="${routes.therapist("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1")}"`,
    );
  });

  it("shows the view switcher only for an admin", () => {
    const admin = renderToStaticMarkup(
      createElement(SiteHeader, {
        initialNavUser: {
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
          role: "admin",
          hasTherapist: true,
        },
        audience: "admin",
      }),
    );
    expect(admin).toContain('aria-label="Site view"');
    expect(admin).toContain("Admin view");
    expect(admin).toContain("Therapist view");
    expect(admin).toContain("Client view");
    expect(admin).toContain("Uploads");
    expect(admin).toContain("Reviews");

    const therapist = renderToStaticMarkup(
      createElement(SiteHeader, {
        initialNavUser: {
          id: "11111111-1111-4111-8111-111111111111",
          role: "therapist",
        },
        audience: "admin",
      }),
    );
    expect(therapist).not.toContain('aria-label="Site view"');
    expect(therapist).not.toContain("Admin view");
    expect(therapist).not.toContain("Uploads");

    const visitor = renderToStaticMarkup(
      createElement(SiteHeader, {
        initialNavUser: null,
        audience: "client",
      }),
    );
    expect(visitor).not.toContain('aria-label="Site view"');
    expect(visitor).not.toContain("Uploads");
    expect(visitor).toContain("Therapist log in");
  });

  it("uses public nav in client view and therapist nav in therapist view", () => {
    const client = renderToStaticMarkup(
      createElement(SiteHeader, {
        initialNavUser: {
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
          role: "admin",
          hasTherapist: true,
        },
        audience: "client",
      }),
    );
    expect(client).toContain('aria-label="Site view"');
    expect(client).toContain("For Therapists");
    expect(client).toContain("Sign out");
    expect(client).not.toContain("Uploads");
    expect(client).not.toContain('href="/admin/reviews"');
    expect(client).not.toContain("My profile");
    expect(client).not.toContain("Admin only");

    const therapist = renderToStaticMarkup(
      createElement(SiteHeader, {
        initialNavUser: {
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
          role: "admin",
          hasTherapist: true,
        },
        audience: "therapist",
      }),
    );
    expect(therapist).toContain("My profile");
    expect(therapist).toContain('aria-label="Site view"');
    expect(therapist).not.toContain("Uploads");
    expect(therapist).not.toContain('href="/admin/media"');
    expect(therapist).not.toContain("For Therapists");
    expect(therapist).not.toContain("Admin only");
  });

  it("omits Interest for a signed-out visitor", () => {
    const html = renderToStaticMarkup(
      createElement(SiteHeader, { initialNavUser: null }),
    );
    expect(html).toContain("Find a Therapist");
    expect(html).toContain("For Therapists");
    expect(html).toContain('href="/join"');
    expect(html).toContain("Therapist log in");
    expect(html).toContain('href="/join?mode=signin"');
    expect(html).toContain("Why Kitchen Sink?");
    expect(html).toContain(
      'href="https://everythingbutkitchensink.beehiiv.com/p/two-feet-in-the-kitchen-sink-5219f599263b7fcd"',
    );
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html.indexOf("For Therapists")).toBeLessThan(
      html.indexOf("Why Kitchen Sink?"),
    );
    expect(html.indexOf("Why Kitchen Sink?")).toBeLessThan(
      html.indexOf("Therapist log in"),
    );
    expect(html).not.toContain("Join as a Therapist");
    expect(html).not.toContain("Interest");
    expect(html).not.toContain("/matches");
  });

  it("uses the full header on a therapist profile", () => {
    nav.pathname.mockReturnValue("/t/11111111-1111-4111-8111-111111111111");
    const visitor = renderToStaticMarkup(
      createElement(SiteHeader, { initialNavUser: null }),
    );
    expect(visitor).toContain("Find a Therapist");
    expect(visitor).toContain("For Therapists");
    expect(visitor).toContain("Therapist log in");
    expect(visitor).not.toContain("Admin view");

    const admin = renderToStaticMarkup(
      createElement(SiteHeader, {
        initialNavUser: {
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
          role: "admin",
          hasTherapist: true,
        },
        audience: "admin",
      }),
    );
    expect(admin).toContain("Find a Therapist");
    expect(admin).toContain("Uploads");
    expect(admin).toContain('aria-label="Site view"');
    expect(admin).toContain("Admin view");
    expect(admin).toContain("Client view");

    nav.pathname.mockReturnValue("/join");
    const joinAdmin = renderToStaticMarkup(
      createElement(SiteHeader, {
        initialNavUser: {
          id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
          role: "admin",
        },
        audience: "therapist",
      }),
    );
    expect(joinAdmin).toContain('aria-label="Site view"');
    expect(joinAdmin).not.toContain("Find a Therapist");

    const joinVisitor = renderToStaticMarkup(
      createElement(SiteHeader, { initialNavUser: null }),
    );
    expect(joinVisitor).toContain("Find a Therapist");
    expect(joinVisitor).toContain("Therapist log in");
    expect(joinVisitor).not.toContain("Admin view");
    nav.pathname.mockReturnValue("/");
  });
});
