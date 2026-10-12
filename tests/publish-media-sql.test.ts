import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20261012190000_publish_requires_photo_and_video.sql",
  ),
  "utf8",
);

describe("publish requires photo and video", () => {
  it("rejects a published row that is missing a photo or intro video", () => {
    expect(migration).toContain("private.require_publish_media()");
    expect(migration).toContain(
      "A photo and a short intro video are required to publish",
    );
    expect(migration).toContain("nullif(btrim(p.photo_key), '') is not null");
    expect(migration).toContain("nullif(btrim(p.video_key), '') is not null");
    expect(migration).toContain("if new.published is not true then");
    expect(migration).toContain(
      "before insert or update of published on public.therapists",
    );
    expect(migration).not.toMatch(/set\s+published\s*=\s*false/i);
    expect(migration).not.toContain("search_therapists");
  });
});
