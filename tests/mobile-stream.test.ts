import { describe, expect, it } from "vitest";
import { mobileStreamAfterHero } from "@/lib/profile/mobile-stream";

const prompts = ["one", "two", "three"];

describe("mobileStreamAfterHero", () => {
  it("keeps prompts in order when there is only one media item", () => {
    expect(mobileStreamAfterHero(false, prompts)).toEqual([
      { type: "prompt", prompt: "one" },
      { type: "prompt", prompt: "two" },
      { type: "prompt", prompt: "three" },
    ]);
  });

  it("drops in the second media card after the first prompt", () => {
    expect(mobileStreamAfterHero(true, prompts)).toEqual([
      { type: "prompt", prompt: "one" },
      { type: "media" },
      { type: "prompt", prompt: "two" },
      { type: "prompt", prompt: "three" },
    ]);
  });

  it("returns just the second media card when there are no prompts", () => {
    expect(mobileStreamAfterHero(true, [])).toEqual([{ type: "media" }]);
    expect(mobileStreamAfterHero(false, [])).toEqual([]);
  });
});
