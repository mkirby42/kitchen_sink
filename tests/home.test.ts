import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HomeHero } from "@/components/home/HomeHero";
import { homePanels } from "@/lib/home";
import { routes } from "@/lib/routes";

describe("homePanels", () => {
  it("keeps the client find card", () => {
    expect(homePanels()).toEqual({
      client: {
        title: "Find a therapist who Gets You.",
        body: "Tap the tags you need. We show therapists who match some of them.",
        actions: [
          { href: routes.find, label: "Find a therapist", variant: "primary" },
        ],
      },
    });
  });
});

describe("home hero", () => {
  it("renders the therapist start and the client card", () => {
    const html = renderToStaticMarkup(
      createElement(HomeHero, homePanels()),
    );

    expect(html).toContain("Bring everything.");
    expect(html).toContain("And the");
    expect(html).toContain("kitchen sink.");
    expect(html).toContain(
      "Connect with a therapist you can bring everything — and the kitchen sink — to session.",
    );
    expect(html).toContain("FOR THERAPISTS · FREE");
    expect(html).toContain("You bring the expertise. We&#x27;ll help with the profile.");
    expect(html).toContain("Less setup. Your profile, your voice.");
    expect(html).toContain("Get my profile started →");
    expect(html).toContain("Takes about a minute. We do the rest.");
    expect(html).toContain("Build it myself from scratch");
    expect(html).toContain('href="/join"');
    expect(html).toContain("How it works");
    expect(html).toContain("01 — We get it started");
    expect(html).toContain(
      "We gather the professional info you&#x27;ve already shared publicly and prepare your draft.",
    );
    expect(html).toContain("02 — You make it yours");
    expect(html).toContain("03 — You approve it");
    expect(html).toContain("You&#x27;re in control of how you&#x27;re represented.");
    expect(html).toContain("Start my profile →");
    expect(html).toContain("Nothing goes live until you approve it.");
    expect(html).toContain("Build from scratch");
    expect(html).toContain("Log in");
    expect(html).toContain('href="/join?mode=signin"');
    expect(html).toContain("Looking for a therapist instead?");
    expect(html).toContain("Find a therapist →");
    expect(html).toContain("bg-ink");
    expect(html).toContain("bg-lavender");
    expect(html).toContain("bg-gold");
    expect(html).not.toContain("My profile");
    expect(html).not.toContain("Upload therapist media");
    expect(html).not.toContain("Review queue");
    expect(html).toContain("Find a therapist who Gets You.");
    expect(html).toContain('href="/find"');
    expect(html).not.toContain("Meet clients who are ready to bring it all.");
  });

  it("keeps the find card and leaves off the newsletter band", () => {
    const html = renderToStaticMarkup(
      createElement(HomeHero, homePanels()),
    );

    expect(html).toContain("Find a therapist who Gets You.");
    expect(html).not.toContain("Find a therapist who actually fits.");
    expect(html).not.toContain("Find someone who actually fits.");
    expect(html).not.toContain("From the newsletter");
    expect(html).not.toContain("Why Kitchen Sink?");
    expect(html).not.toContain("The story behind the name and our Why.");
    expect(html).not.toContain("Read the story");
    expect(html).not.toContain("Subscribe to the newsletter");
    expect(html).not.toContain("everythingbutkitchensink.beehiiv.com");
  });
});
