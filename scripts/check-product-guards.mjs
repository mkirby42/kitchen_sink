/**
 * Fails a pull request that edits the product-decision registry or
 * deletes, skips, or weakens tests/guards, unless the PR has the
 * label product-decision-approved.
 *
 * The workflow runs the copy of this file from the base branch, so a
 * pull request cannot no-op the checker by editing it.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const REGISTRY = "docs/product-decisions.md";
const GUARD_DIR = "tests/guards";
const CHECKER = "scripts/check-product-guards.mjs";
const SETUP = "tests/product-guard-setup.mjs";
const WORKFLOW = ".github/workflows/ci.yml";
const VITEST = "vitest.config.ts";

const SKIP_RE =
  /\b(?:it|test|describe)\.(?:skip|todo|only)\b|\b(?:xit|xtest|xdescribe)\s*\(|\.only\s*\(/;

export function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

export function guardWeakenReason(base, head) {
  const before = stripComments(base);
  const after = stripComments(head);
  if (SKIP_RE.test(after) && !SKIP_RE.test(before)) {
    return "a test was skipped, marked todo, or focused with .only";
  }
  const expects = (source) => (source.match(/\bexpect\s*\(/g) || []).length;
  if (expects(after) < expects(before)) {
    return "an expect() was removed";
  }
  const cases = (source) =>
    (source.match(/\b(?:it|test)\s*\(/g) || []).length;
  if (cases(after) < cases(before)) {
    return "a test case was removed";
  }
  for (const literal of assertionLiterals(before)) {
    if (!after.includes(literal)) {
      return `an assertion no longer requires ${JSON.stringify(literal)}`;
    }
  }
  return null;
}

export function assertionLiterals(source) {
  const found = [];
  const re =
    /\.(?:toContain|toBe|toMatch)\(\s*(?:(['"])((?:\\.|(?!\1).)*)\1|\/((?:\\.|[^/\n])*)\/)/g;
  for (const match of source.matchAll(re)) {
    found.push(match[2] ?? match[3]);
  }
  return found;
}

export function workflowRegressions(base, head) {
  const reasons = [];
  for (const marker of [
    "scripts/check-product-guards.mjs",
    "product-decision-approved",
    "scripts/tag-release.mjs",
    "contents: write",
  ]) {
    if (base.includes(marker) && !head.includes(marker)) {
      reasons.push(`CI no longer contains ${JSON.stringify(marker)}`);
    }
  }
  return reasons;
}

function approved() {
  return process.env.PRODUCT_GUARD_APPROVED === "true";
}

function show(rev, path) {
  try {
    return execFileSync("git", ["show", `${rev}:${path}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    return null;
  }
}

function guardPathsAt(rev) {
  let out = "";
  try {
    out = execFileSync(
      "git",
      ["ls-tree", "-r", "--name-only", rev, GUARD_DIR],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
  } catch {
    return [];
  }
  return out
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /\.test\.tsx?$/.test(line));
}

function headSource(path) {
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf8");
}

function diffReasons(baseRev) {
  try {
    execFileSync("git", ["cat-file", "-e", `${baseRev}^{commit}`], {
      stdio: "ignore",
    });
  } catch {
    throw new Error(
      `Cannot read base commit ${baseRev}. Check out the pull request with fetch-depth: 0.`,
    );
  }

  const reasons = [];
  const baseRegistry = show(baseRev, REGISTRY);
  const headRegistry = headSource(REGISTRY);
  if (baseRegistry != null && baseRegistry !== headRegistry) {
    reasons.push(
      `${REGISTRY} changed. Editing a registered ask needs the product-decision-approved label.`,
    );
  }

  const baseChecker = show(baseRev, CHECKER);
  const headChecker = headSource(CHECKER);
  if (baseChecker != null && baseChecker !== headChecker) {
    reasons.push(
      `${CHECKER} changed. The guard checker needs the product-decision-approved label.`,
    );
  }

  const baseSetup = show(baseRev, SETUP);
  const headSetup = headSource(SETUP);
  if (
    baseSetup != null &&
    baseSetup.includes("checkProductGuards") &&
    (headSetup == null || !headSetup.includes("checkProductGuards"))
  ) {
    reasons.push(`${SETUP} no longer runs the product-decision checker.`);
  }

  const baseVitest = show(baseRev, VITEST);
  const headVitest = headSource(VITEST) ?? "";
  if (
    baseVitest != null &&
    baseVitest.includes("product-guard-setup") &&
    !headVitest.includes("product-guard-setup")
  ) {
    reasons.push(`${VITEST} no longer loads the product-decision checker.`);
  }

  const baseWorkflow = show(baseRev, WORKFLOW);
  const headWorkflow = headSource(WORKFLOW) ?? "";
  if (baseWorkflow != null) {
    reasons.push(...workflowRegressions(baseWorkflow, headWorkflow));
  }

  const baseRelease = show(baseRev, "scripts/tag-release.mjs");
  const headRelease = headSource("scripts/tag-release.mjs") ?? "";
  if (baseRelease != null && baseRelease.includes("--generate-notes") && !headRelease.includes("--generate-notes")) {
    reasons.push("scripts/tag-release.mjs no longer generates release notes.");
  }

  for (const path of guardPathsAt(baseRev)) {
    const before = show(baseRev, path);
    const after = headSource(path);
    if (before == null) continue;
    if (after == null) {
      reasons.push(`${path} was deleted.`);
      continue;
    }
    const reason = guardWeakenReason(before, after);
    if (reason) reasons.push(`${path} was weakened: ${reason}`);
  }

  return reasons;
}

export function structureProblems() {
  const problems = [];
  if (!existsSync(REGISTRY)) {
    problems.push(`Missing ${REGISTRY}.`);
    return problems;
  }
  const registry = readFileSync(REGISTRY, "utf8");
  if (!registry.includes("## Pending decision")) {
    problems.push(`${REGISTRY} is missing the Pending decision section.`);
  }
  const referenced = [
    ...registry.matchAll(/tests\/guards\/[A-Za-z0-9_./-]+\.test\.tsx?/g),
  ].map((match) => match[0]);
  const referencedSet = new Set(referenced);
  for (const path of referencedSet) {
    if (!existsSync(path)) problems.push(`${REGISTRY} points at missing ${path}.`);
  }
  if (existsSync(GUARD_DIR)) {
    for (const name of readdirSync(GUARD_DIR)) {
      if (!/\.test\.tsx?$/.test(name)) continue;
      const path = `${GUARD_DIR}/${name}`;
      if (!referencedSet.has(path)) {
        problems.push(`${path} is not listed in ${REGISTRY}.`);
      }
    }
  }
  const workflow = existsSync(WORKFLOW) ? readFileSync(WORKFLOW, "utf8") : "";
  for (const marker of [
    "scripts/check-product-guards.mjs",
    "product-decision-approved",
    "scripts/tag-release.mjs",
    "contents: write",
    "git show",
  ]) {
    if (!workflow.includes(marker)) {
      problems.push(`${WORKFLOW} is missing ${JSON.stringify(marker)}.`);
    }
  }
  const releaseScript = existsSync("scripts/tag-release.mjs")
    ? readFileSync("scripts/tag-release.mjs", "utf8")
    : "";
  if (!releaseScript.includes("--generate-notes") || !releaseScript.includes('"create"')) {
    problems.push("scripts/tag-release.mjs no longer publishes a GitHub Release.");
  }
  const vitest = existsSync(VITEST) ? readFileSync(VITEST, "utf8") : "";
  if (!vitest.includes("product-guard-setup")) {
    problems.push(`${VITEST} does not load the product-decision checker.`);
  }
  const setup = existsSync(SETUP) ? readFileSync(SETUP, "utf8") : "";
  if (!setup.includes("checkProductGuards")) {
    problems.push(`${SETUP} does not call checkProductGuards.`);
  }
  return problems;
}

export function checkProductGuards() {
  const problems = [];
  const base = process.env.PRODUCT_GUARD_BASE?.trim();
  const onPullRequest = process.env.GITHUB_EVENT_NAME === "pull_request" && base;
  if (onPullRequest && !approved()) {
    problems.push(...diffReasons(base));
  }
  problems.push(...structureProblems());
  if (problems.length === 0) return;
  throw new Error(
    [
      "Product-decision guard failed.",
      "Do not delete, skip, or rewrite a guard test to make CI pass.",
      "If this change conflicts with a registered ask, stop and say so in the PR description.",
      "The label product-decision-approved is the only bypass.",
      "",
      ...problems.map((problem) => `- ${problem}`),
    ].join("\n"),
  );
}

function selfTest() {
  const kept = 'expect(html).toContain("Show 4 therapists");\n';
  const weaker = 'expect(html).toContain("Show therapists");\n';
  if (guardWeakenReason(kept, weaker) == null) {
    throw new Error("self-test: replaced assertion was allowed");
  }
  if (guardWeakenReason(kept, `${kept}expect(html).toContain("also");\n`) != null) {
    throw new Error("self-test: an added assertion was rejected");
  }
  if (
    guardWeakenReason(kept, 'it.skip("x", () => { expect(1).toBe(1); });\n') ==
    null
  ) {
    throw new Error("self-test: it.skip was allowed");
  }
  const baseCi = "scripts/check-product-guards.mjs\nscripts/tag-release.mjs\n";
  const dropped = workflowRegressions(baseCi, "scripts/tag-release.mjs\n");
  if (dropped.length !== 1) {
    throw new Error("self-test: missing CI marker was not caught");
  }
}

function isMain() {
  const entry = process.argv[1];
  if (!entry) return false;
  return fileURLToPath(import.meta.url) === entry;
}

if (isMain()) {
  try {
    if (process.argv.includes("--self-test")) {
      selfTest();
    } else {
      checkProductGuards();
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
