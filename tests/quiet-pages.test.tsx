import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import NotFound from "@/app/not-found";
import { ProfileNotFound } from "@/components/profile/ProfileSections";
import { routes } from "@/lib/routes";

describe("quiet pages", () => {
  it("keeps the 404 words and sends Home to the site root", () => {
    const html = renderToStaticMarkup(createElement(NotFound));
    expect(html).toContain(">404<");
    expect(html).toContain("This page could not be found.");
    expect(html).toContain(">Home<");
    expect(html).toContain(`href="${routes.home}"`);
    expect(html).toContain("rounded-card");
    expect(html).toContain("bg-paper");
    expect(html).toContain("text-clay");
    expect(html).toContain("bg-clay");
    expect(html).toContain("text-center");
  });

  it("keeps the therapist-not-found words and the search link", () => {
    const html = renderToStaticMarkup(
      createElement(ProfileNotFound, { backHref: "/find?format=virtual" }),
    );
    expect(html).toContain("Therapist profile");
    expect(html).toContain("find that therapist.");
    expect(html).toContain(
      "They may have closed their practice to new clients, be hidden from Find, or the link is out of date.",
    );
    expect(html).toContain("Back to search");
    expect(html).toContain('href="/find?format=virtual"');
    expect(html).toContain("rounded-card");
    expect(html).toContain("bg-clay");
    expect(html).toContain("text-center");
  });
});
