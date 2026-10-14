import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { VoicePromptCard } from "@/components/profile/VoicePromptCard";

describe("voice prompt card", () => {
  it("shows the title and a play control without requesting the file", () => {
    const src = "https://example.com/storage/v1/object/public/voice/uid/voice.m4a";
    const html = renderToStaticMarkup(
      createElement(VoicePromptCard, {
        name: "Maya Chen",
        prompt: "Start the conversation",
        src,
      }),
    );
    expect(html).toContain('data-voice-prompt="true"');
    expect(html).toContain("Start the conversation");
    expect(html).toContain('aria-label="Play voice prompt for Maya Chen"');
    expect(html).toContain('preload="none"');
    expect(html).not.toContain(src);
  });
});
