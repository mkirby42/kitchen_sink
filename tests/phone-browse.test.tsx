import { describe, expect, it } from "vitest";
import {
  browseStep,
  clampIndex,
  phoneBrowseKey,
  phoneBrowseRootClass,
  phoneScrollerClass,
  phoneSlideClass,
} from "@/lib/search/phone-browse";
import type { SearchFilters } from "@/lib/search/rpc";

const filters: SearchFilters = {
  tags: [],
  virtual: false,
  inPerson: false,
  state: null,
};

describe("phone browse index", () => {
  it("stops at the ends", () => {
    expect(clampIndex(-3, 4)).toBe(0);
    expect(clampIndex(9, 4)).toBe(3);
    expect(clampIndex(1, 0)).toBe(0);
    expect(browseStep(0, 4, -1)).toBe(0);
    expect(browseStep(0, 4, 1)).toBe(1);
    expect(browseStep(3, 4, 1)).toBe(3);
    expect(browseStep(1, 1, 1)).toBe(0);
    expect(browseStep(1, 1, -1)).toBe(0);
  });

  it("changes the remount key when filters or the result ids change", () => {
    const ids = ["a", "b"];
    const base = phoneBrowseKey(filters, ids);
    expect(phoneBrowseKey(filters, ids)).toBe(base);
    expect(phoneBrowseKey({ ...filters, tags: ["Anxiety"] }, ids)).not.toBe(base);
    expect(phoneBrowseKey({ ...filters, virtual: true }, ids)).not.toBe(base);
    expect(phoneBrowseKey({ ...filters, inPerson: true }, ids)).not.toBe(base);
    expect(phoneBrowseKey({ ...filters, state: "CA" }, ids)).not.toBe(base);
    expect(phoneBrowseKey(filters, ["b", "a"])).not.toBe(base);
    expect(phoneBrowseKey(filters, ["a"])).not.toBe(base);
  });
});

describe("phone Find results", () => {
  it("keeps horizontal scrolling from trapping the page", () => {
    expect(phoneScrollerClass).toContain("overflow-x-auto");
    expect(phoneScrollerClass).toContain("snap-x");
    expect(phoneScrollerClass).toContain("snap-mandatory");
    expect(phoneScrollerClass).toContain("auto-cols-[100%]");
    expect(phoneScrollerClass).toContain("[touch-action:pan-x_pan-y]");
    expect(phoneScrollerClass).toContain("overflow-y-clip");
    expect(phoneScrollerClass).not.toContain("overflow-y-auto");
    expect(phoneScrollerClass).not.toContain("overflow-y-hidden");
    expect(phoneScrollerClass).not.toContain("touch-none");
    expect(phoneScrollerClass).not.toContain("touch-pan-x ");
    expect(phoneScrollerClass).not.toContain("h-screen");
    expect(phoneSlideClass).toContain("[scroll-snap-stop:always]");
    expect(phoneBrowseRootClass).toBe("md:hidden");
  });
});
