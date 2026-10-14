import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20261014132545_voice_prompt.sql"),
  "utf8",
);

describe("voice prompt migration", () => {
  it("stores a title with the recording and publishes on photo plus either", () => {
    expect(migration).toContain("add column if not exists voice_key text");
    expect(migration).toContain("add column if not exists voice_prompt text");
    expect(migration).toContain("profiles_voice_pair");
    expect(migration).toContain("private.checked_voice");
    expect(migration).toContain("'voice'");
    expect(migration).toContain("8388608");
    expect(migration).toContain("audio/mp4");
    expect(migration).toContain("audio/webm");
    expect(migration).toContain("voice_insert_own");
    expect(migration).toContain("voice_public_read");
    expect(migration).toContain("p.role = 'patient'");
    expect(migration).toContain(
      "A photo and either a short intro video or a voice prompt are required to publish",
    );
    expect(migration).toContain("nullif(btrim(p.photo_key), '') is not null");
    expect(migration).toContain("nullif(btrim(p.voice_key), '') is not null");
    expect(migration).toContain("nullif(btrim(p.voice_prompt), '') is not null");
    expect(migration).toContain("if new.published is not true then");
    expect(migration).toContain(
      "Add an intro video or a voice prompt before publishing",
    );
    expect(migration).toContain("admin_set_therapist_voice");
    expect(migration).toContain("p_voice_key text default null");
    expect(migration).toContain("voice_key = v_voice_key");
    expect(migration).not.toMatch(/set\s+published\s*=\s*false/i);
    expect(migration).not.toContain("search_therapists");
  });
});
