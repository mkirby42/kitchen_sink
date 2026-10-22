// Product-decision guard. Do not weaken this file to make CI pass.
// See docs/product-decisions.md.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("release tags", () => {
  it("names the first and second release of a UTC day", () => {
    const out = execFileSync(
      "node",
      [
        "--input-type=module",
        "-e",
        [
          'import { nextReleaseTag, utcReleaseDate } from "./scripts/tag-release.mjs";',
          'const date = utcReleaseDate(new Date("2026-10-22T23:30:00Z"));',
          "console.log(nextReleaseTag(date, []));",
          'console.log(nextReleaseTag(date, ["release-2026-10-22-1"]));',
        ].join(" "),
      ],
      { encoding: "utf8" },
    );
    expect(out).toBe("release-2026-10-22-1\nrelease-2026-10-22-2\n");
  });

  it("publishes generated notes from the deploy job and documents rollback", () => {
    const script = readFileSync("scripts/tag-release.mjs", "utf8");
    const workflow = readFileSync(".github/workflows/ci.yml", "utf8");
    const doc = readFileSync("docs/rollback.md", "utf8");
    expect(script).toContain("--generate-notes");
    expect(script).toContain("toISOString");
    expect(workflow).toContain("needs: deploy");
    expect(workflow).toContain("contents: write");
    expect(doc).toContain("Instant Rollback");
    expect(doc).toContain("release-YYYY-MM-DD-N");
    expect(doc).toContain("release-2026-10-22-1");
  });
});