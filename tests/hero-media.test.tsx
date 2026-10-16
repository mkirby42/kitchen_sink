import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HeroMedia } from "@/components/profile/HeroMedia";

const texasLicense = "Licensed by State of Texas / 38047";

function render(
  overrides: Partial<{
    photoUrl: string | null;
    videoUrl: string | null;
    years: number | null;
    licenseCaptions: string[];
    variant: "overlay" | "poster";
    watchLabel: string | null;
  }> = {},
) {
  return renderToStaticMarkup(
    createElement(HeroMedia, {
      name: "Travis White",
      initials: "TW",
      photoUrl: "https://example.com/photo.jpg",
      videoUrl: "https://example.com/intro.mp4",
      licenseCaptions: [texasLicense],
      years: 8,
      ...overrides,
    }),
  );
}

function splitHero(html: string) {
  const at = html.indexOf("data-hero-details");
  return {
    media: at === -1 ? html : html.slice(0, at),
    details: at === -1 ? "" : html.slice(at),
  };
}

describe("HeroMedia", () => {
  it("overlays only the name and license on the photo", () => {
    const { media, details } = splitHero(render());

    expect(media).toContain('aria-label="Play intro video for Travis White"');
    expect(media).toContain("bg-transparent");
    expect(media).toContain("border-paper/80");
    expect(media).not.toContain("backdrop-blur");
    expect(media).not.toContain("bg-ink/20");
    expect(media).not.toContain("bg-paper/10");
    expect(media).not.toContain(
      "bg-paper shadow-[0_8px_28px_rgba(27,39,68,0.28)]",
    );
    expect(media).not.toContain("from-ink/90");
    expect(media).toContain("from-black/75");
    expect(media).toContain(">Travis White<");
    expect(media).toContain(texasLicense);
    expect(media).toContain("photo.jpg");
    expect(media).not.toContain("data-video-still");
    expect(media).not.toContain("intro.mp4");
    expect(media).not.toContain("PsyD");
    expect(media).not.toContain("8 yrs practicing");
    expect(media).not.toContain("Virtual");
    expect(media).not.toContain("1 min intro");
    expect(media).not.toContain("ACT");

    expect(details).not.toContain("PsyD");
    expect(details).toContain("8 yrs practicing");
    expect(details).not.toContain("1 min intro");
    expect(details).not.toContain("Virtual");
    expect(details).not.toContain("In person");
    expect(details).not.toContain("ACT");
    expect(details).not.toContain(texasLicense);
    expect(details).not.toContain(">Travis White<");
  });

  it("leaves the hero details empty when years are unpublished", () => {
    const { media, details } = splitHero(render({ years: null }));

    expect(media).toContain(">Travis White<");
    expect(media).toContain(texasLicense);
    expect(details).toBe("");
    expect(media).not.toContain("Virtual");
    expect(media).not.toContain("In person");
    expect(media).not.toContain("PsyD");
    expect(media).not.toContain("1 min intro");
  });

  it("omits the play control without a video and keeps the license on the photo", () => {
    const { media, details } = splitHero(
      render({ videoUrl: null, years: 1 }),
    );

    expect(media).not.toContain("Play intro video");
    expect(media).not.toContain("1 min intro");
    expect(media).toContain('alt="Travis White"');
    expect(media).toContain(">Travis White<");
    expect(media).toContain(texasLicense);
    expect(details).not.toContain("PsyD");
    expect(details).toContain("1 yr practicing");
    expect(details).not.toContain("Virtual");
    expect(details).not.toContain("In person");
    expect(details).not.toContain("1 min intro");
  });

  it("uses a frame from the video when there is no photo", () => {
    const { media, details } = splitHero(render({ photoUrl: null }));

    expect(media).toContain("data-video-still");
    expect(media).toContain("https://example.com/intro.mp4#t=0.1");
    expect(media).toContain('preload="metadata"');
    expect(media).toContain("muted");
    expect(media).toContain("playsInline");
    expect(media).not.toContain("autoplay");
    expect(media).not.toMatch(/<video[^>]*\scontrols[\s=]/);
    expect(media).not.toContain(">TW<");
    expect(media).not.toContain("<img");
    expect(media).toContain('aria-label="Play intro video for Travis White"');
    expect(media).toContain(">Travis White<");
    expect(media).toContain(texasLicense);
    expect(details).toContain("8 yrs practicing");
  });

  it("keeps the desktop watch pill on a video frame when there is no photo", () => {
    const { media, details } = splitHero(
      render({
        photoUrl: null,
        variant: "poster",
        watchLabel: "Watch Travis's intro",
      }),
    );

    expect(media).toContain('data-hero-variant="poster"');
    expect(media).toContain("data-video-still");
    expect(media).toContain("https://example.com/intro.mp4#t=0.1");
    expect(media).toContain("Watch Travis&#x27;s intro");
    expect(media).toContain('aria-label="Play intro video for Travis White"');
    expect(media).not.toContain(">TW<");
    expect(media).not.toContain("<img");
    expect(media).not.toContain(">Travis White<");
    expect(media).not.toContain(texasLicense);
    expect(details).toBe("");
  });

  it("shows initials and the name on the frame when there is no photo or video", () => {
    const html = render({
      photoUrl: null,
      videoUrl: null,
      licenseCaptions: [],
      years: null,
    });
    const { media, details } = splitHero(html);

    expect(media).toContain(">TW<");
    expect(media).toContain(">Travis White<");
    expect(media).not.toContain("Play intro video");
    expect(details).toBe("");
    expect(html).not.toContain("Licensed by");
    expect(html).not.toContain("↑");
  });
});
