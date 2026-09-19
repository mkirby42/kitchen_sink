import { describe, expect, it } from "vitest";
import {
  LICENSE_STATES,
  filterLicenseStates,
  licenseStateLabel,
  resolveLicenseState,
} from "@/lib/tags/presets";

describe("license state search", () => {
  it("labels CA as California", () => {
    expect(licenseStateLabel("CA")).toBe("California");
  });

  it("finds a state by abbreviation", () => {
    expect(filterLicenseStates("ca").map((state) => state.code)).toEqual([
      "CA",
    ]);
  });

  it("finds a state by full name", () => {
    expect(filterLicenseStates("california").map((state) => state.code)).toEqual(
      ["CA"],
    );
  });

  it("matches a later word so York finds New York", () => {
    expect(filterLicenseStates("york").map((state) => state.code)).toEqual([
      "NY",
    ]);
  });

  it("returns every state when the query is blank", () => {
    expect(filterLicenseStates("").map((state) => state.code)).toEqual([
      ...LICENSE_STATES,
    ]);
  });

  it("resolves unique typed input to a code", () => {
    expect(resolveLicenseState("calif")).toBe("CA");
    expect(resolveLicenseState("NY")).toBe("NY");
  });

  it("does not resolve an ambiguous prefix", () => {
    expect(resolveLicenseState("new")).toBeNull();
  });
});
