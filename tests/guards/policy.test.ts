// Product-decision guard. Do not weaken this file to make CI pass.
// See docs/product-decisions.md.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("product-decision lock", () => {
  it("rejects a weakened guard, a skip, and a removed CI marker", () => {
    execFileSync("node", ["scripts/check-product-guards.mjs", "--self-test"], {
      stdio: "pipe",
    });
  });

  it("keeps the CI job on the base copy of the checker", () => {
    const workflow = readFileSync(".github/workflows/ci.yml", "utf8");
    expect(workflow).toContain("product-guards");
    expect(workflow).toContain("git show");
    expect(workflow).toContain("scripts/check-product-guards.mjs");
    expect(workflow).toContain("product-decision-approved");
    expect(workflow).toContain("PRODUCT_GUARD_BASE");
    expect(workflow).toContain("contents: write");
    expect(workflow).toContain("scripts/tag-release.mjs");
  });

  it("keeps the three undecided asks out of the guards", () => {
    const registry = readFileSync("docs/product-decisions.md", "utf8");
    const pending = registry.slice(registry.indexOf("## Pending decision"));
    expect(pending).toContain("What brings you to therapy?");
    expect(pending).toContain("Only the matching specialty and insurance pills");
    expect(pending).toContain("3 of 4 tags");
    expect(pending).not.toContain("tests/guards/");
    expect(registry).toContain("product-decision-approved");
    expect(readFileSync("AGENTS.md", "utf8")).toContain("tests/guards/");
    expect(readFileSync(".cursor/rules/product-decisions.mdc", "utf8")).toContain(
      "product-decision-approved",
    );
  });
});
