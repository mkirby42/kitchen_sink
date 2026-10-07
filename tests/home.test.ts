import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HomeHero } from "@/components/home/HomeHero";
import { homePanels } from "@/lib/home";
import { routes } from "@/lib/routes";

describe("homePanels", () => {
  it("matches the public homepage mock", () => {
    expect(homePanels({ signedIn: false, therapistId: null })).toEqual({
      client: {
        title: "Find a therapist who actually fits.",
        body: "Tap the tags you need. We show therapists who match some of them.",
        actions: [
          { href: routes.find, label: "Find a therapist", variant: "primary" },
        ],
      },
      therapist: {
        title: "Meet clients who are ready to bring it all.",
        actions: [
          { href: routes.join, label: "Create a profile", variant: "primary" },
          {
            href: routes.joinSignIn,
            label: "Log in",
            variant: "secondary",
          },
        ],
      },
    });
  });

  it("keeps admin upload, review, and an existing profile on the therapist card", () => {
    expect(
      homePanels({
        signedIn: true,
        therapistId: "11111111-1111-4111-8111-111111111111",
        admin: true,
      }),
    ).toEqual({
      client: {
        title: "Find a therapist who actually fits.",
        body: "Tap the tags you need. We show therapists who match some of them.",
        actions: [
          { href: routes.find, label: "Find a therapist", variant: "primary" },
        ],
      },
      therapist: {
        title: "Meet clients who are ready to bring it all.",
        actions: [
          { href: routes.join, label: "Create a profile", variant: "primary" },
          {
            href: routes.joinSignIn,
            label: "Log in",
            variant: "secondary",
          },
          {
            href: "/t/11111111-1111-4111-8111-111111111111",
            label: "My profile",
            variant: "secondary",
          },
          {
            href: routes.adminMedia,
            label: "Upload therapist media",
            variant: "secondary",
          },
          {
            href: routes.adminReviews,
            label: "Review queue",
            variant: "secondary",
          },
        ],
      },
    });
  });

  it("adds My profile for a signed-in therapist", () => {
    const panels = homePanels({
      signedIn: true,
      therapistId: "11111111-1111-4111-8111-111111111111",
    });
    expect(panels.therapist.actions.map((action) => action.label)).toEqual([
      "Create a profile",
      "Log in",
      "My profile",
    ]);
    expect(panels.client.actions[0]?.href).toBe(routes.find);
  });
});

describe("home hero", () => {
  it("renders the mock copy with the therapist path selected", () => {
    const html = renderToStaticMarkup(
      createElement(HomeHero, homePanels({ signedIn: false, therapistId: null })),
    );

    expect(html).toContain("Bring everything.");
    expect(html).toContain("And the");
    expect(html).toContain("kitchen sink.");
    expect(html).toContain(
      "Connect with a therapist you can bring everything — and the kitchen sink — to session.",
    );
    expect(html).toContain("Connect with a Therapist");
    expect(html).toContain("Therapist who is ready to connect");
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("Meet clients who are ready to bring it all.");
    expect(html).toContain("Create a profile");
    expect(html).toContain('href="/join"');
    expect(html).toContain("Log in");
    expect(html).toContain('href="/join?mode=signin"');
    expect(html).toContain("Find a therapist who actually fits.");
    expect(html).toContain('href="/find"');
    expect(html).toContain('data-audience="client"');
    expect(html).toContain('data-audience="therapist"');
    expect(html).toMatch(/data-audience="client"[^>]*hidden/);
    expect(html).not.toMatch(/data-audience="therapist"[^>]*hidden/);
  });
});
