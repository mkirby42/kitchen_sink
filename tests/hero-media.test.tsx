import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HeroMedia } from "@/components/profile/HeroMedia";

const modalities = [
  "ACT",
  "Attachment-Based",
  "CBT",
  "DBT",
  "Existential",
  "Narrative",
  "Solution Focused Brief (SFBT)",
  "Strength-Based",
];

function render(
  overrides: Partial<{
    photoUrl: string | null;
    videoUrl: string | null;
    years: number | null;
    formatLabel: string | null;
    modalities: string[];
    credential: string | null;
    licenseText: string | null;
  }> = {},
) {
  return renderToStaticMarkup(
    createElement(HeroMedia, {
      name: "Travis White",
      initials: "TW",
      photoUrl: "https://example.com/photo.jpg",
      videoUrl: "https://example.com/intro.mp4",
      credential: "PsyD",
      licenseText: "Lic. #38047 (TX)",
      years: 8,
      formatLabel: "Virtual & In-Person",
      modalities,
      ...overrides,
    }),
  );
}

describe("HeroMedia", () => {
  it("keeps a see-through play control and puts identity below the video", () => {
    const html = render();

    expect(html).toContain('aria-label="Play intro video for Travis White"');
    expect(html).toContain("1 min intro");
    expect(html).toContain("bg-transparent");
    expect(html).toContain("border-paper/80");
    expect(html).not.toContain("backdrop-blur");
    expect(html).not.toContain("bg-ink/20");
    expect(html).not.toContain("bg-paper/10");
    expect(html).not.toContain(
      "bg-paper shadow-[0_8px_28px_rgba(27,39,68,0.28)]",
    );
    expect(html).not.toContain("from-ink/90");
    expect(html).not.toContain("absolute inset-x-0 bottom-0");

    const mediaEnd = html.indexOf("1 min intro");
    const nameAt = html.indexOf(">Travis White");
    expect(mediaEnd).toBeGreaterThan(-1);
    expect(nameAt).toBeGreaterThan(mediaEnd);

    expect(html).toContain("PsyD");
    expect(html).toContain("Lic. #38047 (TX)");
    expect(html).toContain("8 yrs practicing");
    expect(html).toContain("Virtual &amp; In-Person");
    expect(html).toContain("ACT · Attachment-Based · CBT");
    expect(html).toContain('class="font-display text-4xl leading-tight tracking-tight text-ink"');
  });

  it("omits the play control without a video and still shows the name under the photo", () => {
    const html = render({ videoUrl: null, years: 1, modalities: [] });

    expect(html).not.toContain("Play intro video");
    expect(html).not.toContain("1 min intro");
    expect(html).toContain('alt="Travis White"');
    expect(html).toContain(">Travis White");
    expect(html).toContain("1 yr practicing");
    expect(html).toContain("↑ Virtual &amp; In-Person");
    expect(html).not.toContain("♡");
  });

  it("shows initials and the name when there is no photo or video", () => {
    const html = render({
      photoUrl: null,
      videoUrl: null,
      credential: null,
      licenseText: null,
      years: null,
      formatLabel: null,
      modalities: [],
    });

    expect(html).toContain(">TW<");
    expect(html).toContain(">Travis White");
    expect(html).not.toContain("Play intro video");
    expect(html).not.toContain("Lic.");
    expect(html).not.toContain("↑");
  });
});
