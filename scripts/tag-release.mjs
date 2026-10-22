/**
 * After the production deploy hook succeeds, tag that commit and
 * publish a GitHub Release. Names are release-YYYY-MM-DD-N in UTC.
 */
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export function utcReleaseDate(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function nextReleaseTag(date, existing) {
  const taken = new Set(existing);
  for (let n = 1; n <= 50; n += 1) {
    const tag = `release-${date}-${n}`;
    if (!taken.has(tag)) return tag;
  }
  throw new Error(`Too many releases on ${date}.`);
}

function remoteTags(date) {
  const out = execFileSync(
    "git",
    ["ls-remote", "--tags", "origin", `refs/tags/release-${date}-*`],
    { encoding: "utf8" },
  );
  return out
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split("refs/tags/")[1])
    .filter(Boolean);
}

function publish() {
  const sha = process.env.GITHUB_SHA?.trim();
  if (!sha) throw new Error("GITHUB_SHA is required.");
  const date = utcReleaseDate();
  const tag = nextReleaseTag(date, remoteTags(date));
  execFileSync(
    "gh",
    [
      "release",
      "create",
      tag,
      "--repo",
      process.env.GITHUB_REPOSITORY,
      "--target",
      sha,
      "--title",
      tag,
      "--generate-notes",
    ],
    { stdio: "inherit" },
  );
  console.log(tag);
}

function isMain() {
  const entry = process.argv[1];
  if (!entry) return false;
  return fileURLToPath(import.meta.url) === entry;
}

if (isMain()) {
  try {
    publish();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
