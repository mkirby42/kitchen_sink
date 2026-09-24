import { describe, expect, it } from "vitest";
import {
  centsToPriceInput,
  parsePriceDraft,
  sanitizePriceDraft,
} from "@/lib/join/price";

describe("rate price free text", () => {
  it("strips currency junk and keeps two decimal places", () => {
    expect(sanitizePriceDraft("$1,650.509")).toBe("1650.50");
    expect(sanitizePriceDraft("165.")).toBe("165.");
    expect(sanitizePriceDraft("abc")).toBe("");
  });

  it("parses dollars to integer cents without float drift", () => {
    expect(parsePriceDraft("165")).toBe(16500);
    expect(parsePriceDraft("165.")).toBe(16500);
    expect(parsePriceDraft("165.5")).toBe(16550);
    expect(parsePriceDraft("165.10")).toBe(16510);
    expect(parsePriceDraft("$100")).toBe(10000);
    expect(parsePriceDraft("")).toBeNull();
    expect(parsePriceDraft(".")).toBeNull();
  });

  it("shows whole dollars without trailing cents", () => {
    expect(centsToPriceInput(10000)).toBe("100");
    expect(centsToPriceInput(16500)).toBe("165");
    expect(centsToPriceInput(16550)).toBe("165.50");
    expect(centsToPriceInput(16505)).toBe("165.05");
    expect(centsToPriceInput(0)).toBe("0");
  });
});
