import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    "supabase/migrations/20261007220000_find_card_video_and_conversation.sql",
  ),
  "utf8",
);

describe("find card video and conversation migration", () => {
  it("keeps one search function and adds video plus the first card", () => {
    expect(migration).toContain(
      "drop function if exists public.search_therapists(text[], boolean, boolean, text, integer, integer)",
    );
    expect(migration).toContain("p.video_key");
    expect(migration).toContain("t.listed or v_admin");
    expect(migration).toContain("order by t.listed asc, hits.match_count desc, p.name");
    expect(migration).toContain("order by item.position asc, item.ctid");
    expect(migration).toContain("limit 1");
    expect(migration).toContain("video_key text");
    expect(migration).toContain("card_prompt text");
    expect(migration).toContain("profile_items_assign_position");
    expect(migration).toContain("profile_items_therapist_position_idx");
    expect(migration.match(/create function public.search_therapists/g)).toHaveLength(
      1,
    );
  });
});